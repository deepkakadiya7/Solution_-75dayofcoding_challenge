class Solution {
public:
    vector<int> sortArray(vector<int>& nums) {
        int n = nums.size();
        for (int i = 0; i < n - 1; ++i) {
            int min_idx = i;
            for (int j = i + 1; j < n; ++j) {
                if (nums[j] < nums[min_idx]) {
                    min_idx = j;
                }
            }
            swap(nums[i], nums[min_idx]);
        }
        return nums;
    }
};
