import math
import statistics
import json
import os
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

class ScoringService:
    """
    Analyzes raw landmark data from a video to calculate various performance scores.
    """
    # --- Constants ---

    # MediaPipe Pose Landmark IDs
    NOSE = 0
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
    ANGLE_DEVIATION_COEFFICIENT = 2
    STABILITY_STD_DEV_COEFFICIENT = 1000
    TRUNK_TILT_ANGLE_COEFFICIENT = 10
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

    def _normalize_angle(self, angle):
        """Normalizes an angle to the [-180, 180] range."""
        while angle > 180:
            angle -= 360
        while angle < -180:
            angle += 360
        return angle

    def _calculate_score(self, value, coefficient, max_points=25):
        """Calculates a score based on a value and coefficient, capped at max_points."""
        return max(0, max_points - (value * coefficient))

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
        
        score = self._calculate_score(avg_deviation, self.ANGLE_DEVIATION_COEFFICIENT)

        return {
            "score": round(score, 3),
            "avg_deviation": round(avg_deviation, 3),
            "avg_tilt_direction": round(avg_tilt_direction, 3),
        }

    # --- Other Scoring Calculations ---

    def _calculate_trunk_uprightness(self):
        """Calculates the tilt of the trunk relative to vertical (Lateral tilt in front view)."""
        tilt_angles_abs = []
        tilt_angles_signed = []
        required_ids = [self.LEFT_SHOULDER, self.RIGHT_SHOULDER, self.LEFT_HIP, self.RIGHT_HIP]

        for landmarks in self._iter_valid_landmarks(required_ids):
            body_vec, body_angle_deg = self._get_body_axis_vector_and_angle(landmarks)
            if body_vec is None:
                continue
            
            # Calculate signed tilt relative to -90 degrees (vertical)
            signed_tilt = self._normalize_angle(body_angle_deg - (-90))
            
            tilt_angles_signed.append(signed_tilt)
            tilt_angles_abs.append(abs(signed_tilt))
        
        score = 0
        avg_tilt_angle = 0
        avg_tilt_direction = 0
        
        if tilt_angles_abs:
            avg_tilt_angle = statistics.mean(tilt_angles_abs)
            avg_tilt_direction = statistics.mean(tilt_angles_signed)
            
            # Score out of 100 then scaled to 25
            score_100 = self._calculate_score(avg_tilt_angle, self.TRUNK_TILT_ANGLE_COEFFICIENT, max_points=100)
            score = score_100 / 4.0
            
        self.chart_data['trunk_uprightness'] = round(score, 3)
        self.detailed_results['trunk_uprightness'] = {
            'score': round(score, 3),
            'avg_tilt_angle': round(avg_tilt_angle, 3),
            'avg_tilt_direction': round(avg_tilt_direction, 3)
        }

    def _calculate_gravity_stability(self):
        """Calculates side-to-side sway for both hips and head."""
        # --- Hip Sway ---
        hip_center_x_coords = []
        hip_required_ids = [self.LEFT_HIP, self.RIGHT_HIP]

        for landmarks in self._iter_valid_landmarks(hip_required_ids):
            hip_center_x = (landmarks[self.LEFT_HIP]['x'] + landmarks[self.RIGHT_HIP]['x']) / 2
            hip_center_x_coords.append(hip_center_x)

        hip_score = 0
        hip_stdev = 0
        avg_hip_sway_direction = 0
        
        if len(hip_center_x_coords) >= 2:
            hip_stdev = statistics.stdev(hip_center_x_coords)
            avg_hip_sway_direction = statistics.mean(hip_center_x_coords) - 0.5
            hip_score = self._calculate_score(hip_stdev, self.STABILITY_STD_DEV_COEFFICIENT)

        # --- Head Sway ---
        nose_x_coords = []
        head_required_ids = [self.NOSE]

        for landmarks in self._iter_valid_landmarks(head_required_ids):
            nose_x = landmarks[self.NOSE]['x']
            nose_x_coords.append(nose_x)

        head_score = 0
        head_stdev = 0
        avg_head_sway_direction = 0
        
        if len(nose_x_coords) >= 2:
            head_stdev = statistics.stdev(nose_x_coords)
            avg_head_sway_direction = statistics.mean(nose_x_coords) - 0.5
            head_score = self._calculate_score(head_stdev, self.STABILITY_STD_DEV_COEFFICIENT)

        # --- Combined Score ---
        # Average of hip and head stability scores
        combined_score = (hip_score + head_score) / 2

        self.chart_data['gravity_stability'] = round(combined_score, 3)
        self.detailed_results['gravity_stability'] = {
            'score': round(combined_score, 3),
            'hip_score': round(hip_score, 3),
            'hip_sway_magnitude': round(hip_stdev, 5),
            'avg_hip_sway_direction': round(avg_hip_sway_direction, 3),
            'head_score': round(head_score, 3),
            'head_sway_magnitude': round(head_stdev, 5),
            'avg_head_sway_direction': round(avg_head_sway_direction, 3)
        }
  
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
        std_dev = 0
        if all_intervals:
            std_dev = statistics.stdev(all_intervals) if len(all_intervals) > 1 else 0
            # Score out of 100 then scaled to 25
            score_100 = self._calculate_score(std_dev, self.RHYTHM_STD_DEV_COEFFICIENT, max_points=100)
            score = score_100 / 4.0

        self.chart_data['rhythmic_accuracy'] = round(score, 3)
        self.detailed_results['rhythmic_accuracy'] = {
            'score': round(score, 3),
            'rhythm_consistency': round(std_dev, 5)
        }

    def _generate_feedback(self):
        """Generates feedback based on the overall score and advice."""
        feedback = f"総合スコアは {self.overall_score}点です！\n\n"
        feedback += self._generate_advice()
        return feedback

    def _generate_advice(self):
        """Generates advice using Google Gemini Flash."""
        if not self.detailed_results:
            return ""

        # Load expert knowledge
        expert_knowledge = ""
        try:
            # services.py is in backend/api/services.py
            # We want to look in backend/expert_knowledge.md
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            knowledge_path = os.path.join(backend_dir, "expert_knowledge.md")
            
            if os.path.exists(knowledge_path):
                with open(knowledge_path, "r", encoding="utf-8") as f:
                    expert_knowledge = f.read()
        except Exception as e:
            print(f"Failed to load expert knowledge: {e}")

        # Construct prompt
        prompt = f"""
# 役割
あなたは、データに基づきユーザーの可能性を最大限に引き出す「ロジカルかつ前向きなパーソナルウォーキングコーチ」です。
あなたの使命は、数値を冷静に分析し、その結果を「どうすればもっと良くなるか」というポジティブな解決策に変換して伝えることです。

# 入力データ
専門知識:
{expert_knowledge}

ユーザー分析データ(JSON):
{json.dumps(self.detailed_results, ensure_ascii=False, indent=2)}

総合スコア:
{self.overall_score} 点

# 安全性・倫理ガードレール（最重要遵守事項）
1.  **医療用語の禁止**:
    - 「診断」「症状」「疾患」「異常」「治療」「リハビリ」「症候群」「～病」「～障害」といった言葉は絶対に使用しないでください。
    - 代わりに「クセ」「特徴」「傾向」「改善ポイント」「コンディショニング」「エクササイズ」といった言葉を使用してください。
    - 特定の病名（例：脊柱側弯症、トレンデレンブルグ徴候、パーキンソン病など）の推測・言及は禁止です。
2.  **断定の回避**:
    - 「～です」と身体の状態を断定するのではなく、「～の傾向が見られます」「～の可能性があります」とデータ上の数値を解説するスタンスを守ってください。

# 思考プロセスと制約条件（最重要）
1. **比較対象の原則**:
   - 「平均値と比較して〜」は禁止。常に「物理的に理想的なフォーム（角度0度、安定性0.0）」と比較してください。
2. **Sランクの絶対肯定**:
   - データがナレッジベースの「Sランク」範囲内にある項目は、**いかなる改善提案も行わず、「最強の武器」として手放しで絶賛してください。**
3. **クロス分析の優先（New!）**:
   - 個別の項目を評価する前に、必ずナレッジベースの**「4. 複合要因分析ルール」**と照合してください。
   - もし「パターンA（代償動作）」などに該当する場合は、単なる「肩が傾いています」という指摘ではなく、「腰の弱さが肩に影響しています」という**因果関係に基づいた深いアドバイス**を優先してください。
4. **メリハリ**:
   - 良い点は「なぜ素晴らしいか」、悪い点は「直すとどう変わるか（メリット）」を提示してください。

# 出力テンプレート

## 🚀 未来を変えるウォーキング分析：現在のスコア {self.overall_score}点

### 🌟 あなたのウォーキングタイプ
**「[ここにポジティブで特徴的なタイプ名を生成]」**

### 📈 総合レビュー
[スコアの背景とポテンシャルを150文字程度で。Sランク項目がある場合は「〇〇という強力な武器を持っています」と強調。課題点は「ここさえ磨けばさらに伸びます」と前向きに記述]

### 🔗 動きの連動性（プロの視点）
[**重要: ここでクロス分析の結果を披露してください**]
[該当するパターンがあれば：「一見、肩の傾きが気になりますが、データを見ると**実は腰の不安定さが原因**である可能性が高いです...」のように記述]
[該当パターンがない場合：「姿勢の安定性が、美しいリズムを生み出す土台になっています...」のように、良い項目の相乗効果を記述]

### 💡 項目別・ネクストステップ

#### 1. 体幹の直立性
- **評価:** [Sランクなら「文句なしのSランク」、それ以外はランクに応じた評価]
- **分析:** [数値を引用。クロス分析で「全身の歪み」と診断された場合はその旨を記載]
- **アクション:** [ナレッジベースに基づいた具体的な解決策]

#### 2. 左右対称性
- **評価:** [評価]
- **分析:** [数値を引用。クロス分析で「代償動作（腰が原因）」と診断された場合は、「肩そのものではなく腰へのアプローチが有効です」と記載]
- **アクション:** [ナレッジベースに基づいたアクション]

#### 3. 重心安定性
- **評価:** [評価]
- **分析:** [数値を引用]
- **アクション:** [トレーニング案]

#### 4. リズム
- **評価:** [評価]
- **分析:** [数値を引用。クロス分析で「過緊張」と診断された場合は「リラックス」を提案]
- **アクション:** [トレーニング案]

---
**✨ コーチからのエール**
[論理的かつ情熱的な締めくくりのメッセージ]
"""
        
        print("Starting Gemini generation...")
        start_time = time.time()
        
        try:
            client = genai.Client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            elapsed_time = time.time() - start_time
            print(f"Gemini generation took {elapsed_time:.2f} seconds.")
            
            return response.text
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return "（アドバイス生成に失敗しました。APIキーまたはネットワーク接続を確認してください。）"