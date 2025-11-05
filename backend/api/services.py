import math
import statistics

class ScoringService:
    def __init__(self, raw_landmarks):
        self.raw_landmarks = raw_landmarks
        self.chart_data = {}
        self.overall_score = 0
        self.feedback_text = ""
        
    def calculate_all(self):
        self._calculate_symmetry()###対称性
        self._calculate_trunk_uprightness()###体幹の直立度
        self._calculate_gravity_stability()###重心の安定性
        self._calculate_rhythmic_accuracy()###リズムの正確さ
        self._calculate_movement_smoothness()###動作の滑らかさ
        self.overall_score = round(sum(self.chart_data.values()), 3)
        
        self.feedback_text = self._generate_feedback()
        
        return {
            "chart_data": self.chart_data,
            "overall_score": self.overall_score,
            "feedback_text": self.feedback_text
        }

        
    def _calculate_symmetry(self):
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        VISIBILITY_THRESHOLD = 0.85
        
        sum_of_y_diffs = 0
        valid_frames_count = 0
        
        for frame_landmarks in self.raw_landmarks:
            if frame_landmarks and frame_landmarks[0]:
                landmarks = frame_landmarks[0]
                if len(landmarks) > RIGHT_SHOULDER:
                    left_shoulder = landmarks[LEFT_SHOULDER]
                    right_shoulder = landmarks[RIGHT_SHOULDER]
                    
                    if left_shoulder.get('visibility', 0) > VISIBILITY_THRESHOLD and right_shoulder.get('visibility', 0) > VISIBILITY_THRESHOLD:
                        y_diff_for_frame = abs(left_shoulder['y'] - right_shoulder['y'])
                        sum_of_y_diffs += y_diff_for_frame
                        
                        valid_frames_count += 1
                        
        if valid_frames_count > 0:
            avg_y_diff = sum_of_y_diffs / valid_frames_count
            
            symmetry_score_100 = max(0, 100 - (avg_y_diff * 3000))
            symmetry_score = symmetry_score_100 / 5.0
        else:
            symmetry_score = 0
        
        self.chart_data['symmetry'] = round(symmetry_score, 3)
                        
    
    def _calculate_trunk_uprightness(self):
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24
        VISIBILITY_THRESHOLD = 0.85
        
        sum_of_angles = 0
        valid_frames_count = 0
        
        required_ids = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP]
        
        for frame_landmarks in self.raw_landmarks:
            if not (frame_landmarks and frame_landmarks[0]):
                continue
            landmarks = frame_landmarks[0]
            
            if not all(len(landmarks) > i for i in required_ids):
                continue
            
            left_shoulder = landmarks[LEFT_SHOULDER]
            right_shoulder = landmarks[RIGHT_SHOULDER]
            left_hip = landmarks[LEFT_HIP]
            right_hip = landmarks[RIGHT_HIP]
            
            if not all(lm.get('visibility', 0) > VISIBILITY_THRESHOLD for lm in [left_shoulder,right_shoulder, left_hip, right_hip]):
                continue
            
            shoulder_mid_y = (left_shoulder['y'] + right_shoulder['y']) / 2
            shoulder_mid_x = (left_shoulder['x'] + right_shoulder['x']) / 2
            hip_mid_y = (left_hip['y'] + right_hip['y']) / 2
            hip_mid_x = (left_hip['x'] + right_hip['x']) / 2
            
            torso_vec_y = shoulder_mid_y - hip_mid_y
            torso_vec_x = shoulder_mid_x - hip_mid_x
            
            angle_rad = math.atan2(torso_vec_y, torso_vec_x)
            angle_deg = math.degrees(angle_rad)
            
            vertical_angle = -90
            tilt_angle = abs(angle_deg - vertical_angle)
            
            if tilt_angle > 180:
                tilt_angle = 360 - tilt_angle
            
            sum_of_angles += tilt_angle
            valid_frames_count += 1
        
        if valid_frames_count > 0:
            avg_tilt_angle = sum_of_angles / valid_frames_count
            score_100 = max(0, 100 - (avg_tilt_angle * (100 / 4)))
            score = score_100 / 5.0
        else:
            score = 0
            
        self.chart_data['trunk_uprightness'] = round(score, 3)

     
            
            
            
        
    def _calculate_gravity_stability(self):

        LEFT_HIP = 23
        RIGHT_HIP = 24
        VISIBILITY_THRESHOLD = 0.85

        hip_center_x_coords = []

        
        for frame_landmarks in self.raw_landmarks:
            if not (frame_landmarks and frame_landmarks[0]):
                continue 

            landmarks = frame_landmarks[0] 

            
            if (len(landmarks) > RIGHT_HIP and 
                landmarks[LEFT_HIP].get('visibility', 0) > VISIBILITY_THRESHOLD and
                landmarks[RIGHT_HIP].get('visibility', 0) > VISIBILITY_THRESHOLD):

                left_hip_x = landmarks[LEFT_HIP]['x']
                right_hip_x = landmarks[RIGHT_HIP]['x']

                hip_center_x = (left_hip_x + right_hip_x) / 2
                hip_center_x_coords.append(hip_center_x)

        score = 0
        if len(hip_center_x_coords) < 2:
            
            score = 0
        else:
            stdev = statistics.stdev(hip_center_x_coords)

            
            COEFFICIENT = 400 
            score = max(0, 20 - (stdev * COEFFICIENT))

        self.chart_data['gravity_stability'] = round(score, 3)
  
        

    
    def _calculate_rhythmic_accuracy(self):
        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28
        VISIBILITY_THRESHOLD = 0.85

        left_y = []
        right_y = []

        
        for frame_landmarks in self.raw_landmarks:
            if not (frame_landmarks and frame_landmarks[0]):
                continue
            landmarks = frame_landmarks[0]
            if len(landmarks) > RIGHT_ANKLE:
                left_ankle = landmarks[LEFT_ANKLE]
                right_ankle = landmarks[RIGHT_ANKLE]

                if left_ankle.get('visibility', 0) > VISIBILITY_THRESHOLD:
                    left_y.append(left_ankle['y'])
                if right_ankle.get('visibility', 0) > VISIBILITY_THRESHOLD:
                    right_y.append(right_ankle['y'])

        
        def detect_peaks(y_list):
            peaks = []
            last_peak = None
            for i in range(1, len(y_list) - 1):
                if y_list[i - 1] > y_list[i] < y_list[i + 1]:
                    if last_peak is not None:
                        peaks.append(i - last_peak)
                    last_peak = i
            return peaks

        left_intervals = detect_peaks(left_y)
        right_intervals = detect_peaks(right_y)
        all_intervals = left_intervals + right_intervals

        
        if all_intervals:
            avg_interval = sum(all_intervals) / len(all_intervals)
            variance = sum((x - avg_interval) ** 2 for x in all_intervals) / len(all_intervals)
            std_dev = math.sqrt(variance)

            score_100 = max(0, 100 - std_dev * 15)
            score = score_100 / 5.0  
        else:
            score = 0

        self.chart_data['rhythmic_accuracy'] = round(score, 3)

        
    def _calculate_movement_smoothness(self):
        self.chart_data['movement_smoothness'] = 16.0
   
    
    def _generate_feedback(self):
        return f"総合スコアは {self.overall_score}点です！"
    