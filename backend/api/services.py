import math
import statistics

class ScoringService:
    """
    Analyzes raw landmark data from a video to calculate various performance scores.
    """
    # --- Constants ---

    # MediaPipe Pose Landmark IDs
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28

    # Visibility threshold for a landmark to be considered reliable
    VISIBILITY_THRESHOLD = 0.85

    # Scoring coefficients
    ANGLE_DEVIATION_COEFFICIENT = 5
    STABILITY_STD_DEV_COEFFICIENT = 500
    TRUNK_TILT_ANGLE_COEFFICIENT = 4
    RHYTHM_STD_DEV_COEFFICIENT = 15

    def __init__(self, raw_landmarks):
        self.raw_landmarks = raw_landmarks
        self.chart_data = {}
        self.detailed_results = {}
        self.overall_score = 0
        self.feedback_text = ""

    def calculate_all(self):
        """
        Executes all scoring calculations and returns the aggregated results.
        """
        self._calculate_symmetry()
        self._calculate_trunk_uprightness()
        self._calculate_gravity_stability()
        self._calculate_rhythmic_accuracy()
        self.overall_score = round(sum(self.chart_data.values()), 3)
        
        self.feedback_text = self._generate_feedback()
        
        return {
            "chart_data": self.chart_data,
            "detailed_results": self.detailed_results,
            "overall_score": self.overall_score,
            "feedback_text": self.feedback_text,
        }

    # --- Helper Methods ---

    def _iter_valid_landmarks(self, required_ids):
        """
        A generator that yields landmark data for frames where all required landmarks are visible.
        """
        for frame_landmarks in self.raw_landmarks:
            if not (frame_landmarks and frame_landmarks[0]):
                continue
            
            landmarks = frame_landmarks[0]
            
            if all(len(landmarks) > i and landmarks[i].get('visibility', 0) > self.VISIBILITY_THRESHOLD for i in required_ids):
                yield landmarks

    def _get_body_axis_vector_and_angle(self, landmarks):
        """
        Calculates the vector representing the body's vertical axis and its angle.
        """
        required_ids = {self.LEFT_SHOULDER, self.RIGHT_SHOULDER, self.LEFT_HIP, self.RIGHT_HIP}
        if not all(len(landmarks) > i and landmarks[i].get('visibility', 0) > self.VISIBILITY_THRESHOLD for i in required_ids):
            return None, None

        shoulder_mid_x = (landmarks[self.LEFT_SHOULDER]['x'] + landmarks[self.RIGHT_SHOULDER]['x']) / 2
        shoulder_mid_y = (landmarks[self.LEFT_SHOULDER]['y'] + landmarks[self.RIGHT_SHOULDER]['y']) / 2
        hip_mid_x = (landmarks[self.LEFT_HIP]['x'] + landmarks[self.RIGHT_HIP]['x']) / 2
        hip_mid_y = (landmarks[self.LEFT_HIP]['y'] + landmarks[self.RIGHT_HIP]['y']) / 2
        
        body_vec_x = shoulder_mid_x - hip_mid_x
        body_vec_y = shoulder_mid_y - hip_mid_y
        
        body_angle_rad = math.atan2(body_vec_y, body_vec_x)
        body_angle_deg = math.degrees(body_angle_rad)
        
        return (body_vec_x, body_vec_y), body_angle_deg

    def _get_angle_relative_to_body_horizontal(self, p1_x, p1_y, p2_x, p2_y, body_vertical_angle_deg):
        """
        Calculates the angle of a line segment (p1 to p2) relative to the body's horizontal axis.
        """
        line_vec_x = p2_x - p1_x
        line_vec_y = p2_y - p1_y
        
        if line_vec_x == 0 and line_vec_y == 0:
            return 0

        line_angle_rad = math.atan2(line_vec_y, line_vec_x)
        line_angle_deg = math.degrees(line_angle_rad)
        
        if line_angle_deg > 90:
            line_angle_deg -= 180
        elif line_angle_deg <= -90:
            line_angle_deg += 180
        
        body_horizontal_angle_deg = body_vertical_angle_deg + 90
        
        if body_horizontal_angle_deg > 90:
            body_horizontal_angle_deg -= 180
        elif body_horizontal_angle_deg <= -90:
            body_horizontal_angle_deg += 180

        angle_diff = line_angle_deg - body_horizontal_angle_deg
        
        while angle_diff > 180:
            angle_diff -= 360
        while angle_diff < -180:
            angle_diff += 360
            
        return angle_diff

    # --- Symmetry Calculation ---

    def _calculate_symmetry(self):
        """Orchestrates the calculation of symmetry for various body parts."""
        parts_to_analyze = {
            "shoulders": (self.LEFT_SHOULDER, self.RIGHT_SHOULDER),
            "hips": (self.LEFT_HIP, self.RIGHT_HIP),
        }
        
        symmetry_results = {}
        for part_name, ids in parts_to_analyze.items():
            symmetry_results[part_name] = self._calculate_symmetry_for_part(ids[0], ids[1])
            
        self.detailed_results['symmetry'] = symmetry_results
        self.chart_data['symmetry'] = symmetry_results.get('shoulders', {}).get('score', 0)

    def _calculate_symmetry_for_part(self, left_id, right_id):
        """Calculates detailed symmetry metrics."""
        angles = []
        required_ids = {self.LEFT_SHOULDER, self.RIGHT_SHOULDER, self.LEFT_HIP, self.RIGHT_HIP, left_id, right_id}

        for landmarks in self._iter_valid_landmarks(required_ids):
            body_vec, body_angle_deg = self._get_body_axis_vector_and_angle(landmarks)
            if body_vec is None:
                continue

            left_lm = landmarks[left_id]
            right_lm = landmarks[right_id]

            angle = self._get_angle_relative_to_body_horizontal(
                left_lm['x'], left_lm['y'], right_lm['x'], right_lm['y'], body_angle_deg
            )
            angles.append(angle)

        if not angles:
            return {"score": 0, "avg_deviation": 0, "avg_tilt_direction": 0}

        avg_tilt_direction = statistics.mean(angles)
        avg_deviation = statistics.mean([abs(a) for a in angles])
        
        score = max(0, 25 - (avg_deviation * self.ANGLE_DEVIATION_COEFFICIENT))

        return {
            "score": round(score, 3),
            "avg_deviation": round(avg_deviation, 3),
            "avg_tilt_direction": round(avg_tilt_direction, 3),
        }

    # --- Other Scoring Calculations ---

    def _calculate_trunk_uprightness(self):
        """Calculates the forward/backward tilt of the trunk relative to vertical."""
        tilt_angles = []
        required_ids = [self.LEFT_SHOULDER, self.RIGHT_SHOULDER, self.LEFT_HIP, self.RIGHT_HIP]

        for landmarks in self._iter_valid_landmarks(required_ids):
            body_vec, body_angle_deg = self._get_body_axis_vector_and_angle(landmarks)
            if body_vec is None:
                continue
            
            tilt_angle = abs(body_angle_deg - (-90))
            if tilt_angle > 180:
                tilt_angle = 360 - tilt_angle
            
            tilt_angles.append(tilt_angle)
        
        score = 0
        avg_tilt_angle = 0
        if tilt_angles:
            avg_tilt_angle = statistics.mean(tilt_angles)
            score_100 = max(0, 100 - (avg_tilt_angle * self.TRUNK_TILT_ANGLE_COEFFICIENT))
            score = score_100 / 4.0
            
        self.chart_data['trunk_uprightness'] = round(score, 3)
        self.detailed_results['trunk_uprightness'] = {
            'avg_tilt_angle': round(avg_tilt_angle, 3)
        }

    def _calculate_gravity_stability(self):
        """Calculates side-to-side sway."""
        hip_center_x_coords = []
        required_ids = [self.LEFT_HIP, self.RIGHT_HIP]

        for landmarks in self._iter_valid_landmarks(required_ids):
            hip_center_x = (landmarks[self.LEFT_HIP]['x'] + landmarks[self.RIGHT_HIP]['x']) / 2
            hip_center_x_coords.append(hip_center_x)

        score = 0
        if len(hip_center_x_coords) >= 2:
            stdev = statistics.stdev(hip_center_x_coords)
            score = max(0, 25 - (stdev * self.STABILITY_STD_DEV_COEFFICIENT))

        self.chart_data['gravity_stability'] = round(score, 3)
  
    def _calculate_rhythmic_accuracy(self):
        """Calculates the consistency of the walking rhythm."""
        left_y, right_y = [], []
        required_ids = [self.LEFT_ANKLE, self.RIGHT_ANKLE]

        for landmarks in self._iter_valid_landmarks(required_ids):
            left_y.append(landmarks[self.LEFT_ANKLE]['y'])
            right_y.append(landmarks[self.RIGHT_ANKLE]['y'])

        def detect_step_intervals(y_list):
            intervals = []
            last_peak_index = None
            for i in range(1, len(y_list) - 1):
                if y_list[i - 1] > y_list[i] < y_list[i + 1]:
                    if last_peak_index is not None:
                        intervals.append(i - last_peak_index)
                    last_peak_index = i
            return intervals

        all_intervals = detect_step_intervals(left_y) + detect_step_intervals(right_y)
        
        score = 0
        if all_intervals:
            std_dev = statistics.stdev(all_intervals) if len(all_intervals) > 1 else 0
            score_100 = max(0, 100 - (std_dev * self.RHYTHM_STD_DEV_COEFFICIENT))
            score = score_100 / 4.0

        self.chart_data['rhythmic_accuracy'] = round(score, 3)

    def _generate_feedback(self):
        """Generates a simple feedback message based on the overall score."""
        return f"総合スコアは {self.overall_score}点です！"