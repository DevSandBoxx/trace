import json
import numpy as np

def load_pose_data(file_path):
    """Load pose data from a JSON file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def normalize_keypoints(keypoints, width, height):
    """Normalize keypoints coordinates based on frame dimensions."""
    return [
        {
            'x': kp['x'] / width,
            'y': kp['y'] / height,
            'score': kp['score'],
            'name': kp['name']
        }
        for kp in keypoints
    ]

def calculate_distance(kp1, kp2):
    """Calculate Euclidean distance between two keypoints (normalized coordinates)."""
    return np.sqrt(
        (kp1['x'] - kp2['x']) ** 2 +
        (kp1['y'] - kp2['y']) ** 2
    )

def compare_poses(pose1, pose2, distance_threshold=0.05):
    """
    Compare two poses by comparing their normalized keypoints.
    Returns similarity percentage based on the number of matching keypoints.
    """
    matching_keypoints = 0
    total_comparisons = 0

    if not pose1 or not pose2:
        print(f"Skipping empty pose. pose1 length: {len(pose1)}, pose2 length: {len(pose2)}")
        return 0  # No keypoints to compare

    for kp1, kp2 in zip(pose1, pose2):
        if isinstance(kp1, dict) and isinstance(kp2, dict):
            distance = calculate_distance(kp1, kp2)
            # Debugging information
            print(f"Comparing keypoints {kp1['name']} - Distance: {distance:.4f}")

            if distance < distance_threshold:
                matching_keypoints += 1
            total_comparisons += 1

    if total_comparisons == 0:
        return 0

    print(f"Matching keypoints: {matching_keypoints}/{total_comparisons}")
    return (matching_keypoints / total_comparisons) * 100

def compare_videos(video1_data, video2_data, frame_width, frame_height, frame_similarity_threshold=90):
    """
    Compare two videos by comparing their frames.
    Returns the overall similarity as a percentage of matching frames.
    """
    total_frames = min(len(video1_data), len(video2_data))
    matching_frames = 0

    for frame1, frame2 in zip(video1_data, video2_data):
        if not frame1 or not frame2:
            print("Skipping empty frame.")
            continue

        # Extract the first pose from each frame
        pose1 = frame1[0] if frame1 else []
        pose2 = frame2[0] if frame2 else []

        # Normalize keypoints
        pose1_normalized = normalize_keypoints(pose1, frame_width, frame_height)
        pose2_normalized = normalize_keypoints(pose2, frame_width, frame_height)

        frame_similarity = compare_poses(pose1_normalized, pose2_normalized)
        print(f"Frame similarity: {frame_similarity:.2f}%")

        if frame_similarity >= frame_similarity_threshold:
            matching_frames += 1

    overall_similarity = (matching_frames / total_frames) * 100
    return overall_similarity

def main():
    # Load the two JSON files containing pose data
    video1_pose_data = load_pose_data("C:/Users/areeb/Downloads/pose-data.json")
    video2_pose_data = load_pose_data("C:/Users/areeb/Downloads/pose-data (3).json")

    # Set the frame dimensions (update with actual values)
    frame_width = 640   # Replace with your video frame width
    frame_height = 480  # Replace with your video frame height

    # Compare the two videos
    similarity_percentage = compare_videos(
        video1_pose_data, video2_pose_data, frame_width, frame_height, frame_similarity_threshold=90
    )

    # Determine if one video is copied
    if similarity_percentage >= 90:
        print(f"The videos are {similarity_percentage:.2f}% similar. One of the videos is likely copied.")
    else:
        print(f"The videos are {similarity_percentage:.2f}% similar. The videos are not copies.")

if __name__ == "__main__":
    main()
