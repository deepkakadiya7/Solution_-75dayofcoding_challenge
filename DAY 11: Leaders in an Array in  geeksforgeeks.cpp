class Solution {
    // Function to find the leaders in the array.
  public:
    vector<int> leaders(int n, int arr[]) {
        vector<int> ans;
  
  for (int i = 0; i < n; i++) {
    bool leader = true;
    for (int j = i + 1; j < n; j++)
      if (arr[j] > arr[i]) {
        leader = false;
        break;
      }
    if (leader)
    ans.push_back(arr[i]);

  }
  
  return ans;
    }
};


// Complexity Analysis
// Time Complexity: O(N^2) { Since there are nested loops being used, at the worst case n^2 time would be consumed }.

// Space Complexity: O(N) { There is no extra space being used in this approach. But, a O(N) of space for ans array will be used in the worst case }.
