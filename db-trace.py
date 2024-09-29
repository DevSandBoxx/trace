import json
import numpy as np
from pymongo import MongoClient

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

def compare_with_mongodb(target_data, mongo_uri, db_name, collection_name, frame_width, frame_height, similarity_threshold=90):
    """
    Compare a target pose data against multiple JSON documents in a MongoDB collection.
    """
    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]

    # Fetch all documents from the MongoDB collection
    documents = collection.find({})

    for doc in documents:
        print(f"\nComparing with document {doc['_id']}...")

        # Assuming pose data in MongoDB is stored in a field named 'pose_data'
        db_data = doc['pose_data']  # Adjust this to your actual MongoDB document structure

        # Compare the target video data with the current document's pose data
        similarity_percentage = compare_videos(target_data, db_data, frame_width, frame_height, similarity_threshold)

        if similarity_percentage >= similarity_threshold:
            print(f"Document {doc['_id']} is {similarity_percentage:.2f}% similar to the target video. It might be a copy.")
        else:
            print(f"Document {doc['_id']} is {similarity_percentage:.2f}% similar. No significant similarity.")

def main():
    # Target file to compare
    target_file = "C:/Users/areeb/Downloads/pose-data.json"

    # MongoDB details
    mongo_uri = "mongodb://localhost:27017/"  # Update with your MongoDB URI
    db_name = "your_db_name"                  # Update with your MongoDB database name
    collection_name = "your_collection_name"  # Update with your MongoDB collection name

    # Set the frame dimensions (update with actual values)
    frame_width = 640   # Replace with your video frame width
    frame_height = 480  # Replace with your video frame height

    # Load the target pose data from JSON file
    target_data = load_pose_data(target_file)

    # Compare the target file with all documents in the MongoDB collection
    compare_with_mongodb(target_data, mongo_uri, db_name, collection_name, frame_width, frame_height, similarity_threshold=90)

if __name__ == "__main__":
    main()
