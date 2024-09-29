
#closer to one means perfect similarity
def cosSim(A, B):

  # Calculate dot product
  dot_product = sum(a*b for a, b in zip(A, B))

  # Calculate the magnitude of each vector
  magnitude_A = sum(a*a for a in A)**0.5
  magnitude_B = sum(b*b for b in B)**0.5

  # Compute cosine similarity
  cosine_similarity = dot_product / (magnitude_A * magnitude_B)
  # print(f"Cosine Similarity using standard Python: {cosine_similarity}")
  return cosine_similarity


def main():
  A = [5, 3, 4]
  B = [4, 2, 4]
  cosSim(A,B)

if __name__ == "__main__":
  main()