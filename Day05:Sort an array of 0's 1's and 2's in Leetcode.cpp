class Solution {
public:
    void sortColors(vector<int>& nums) {
        int n = nums.size();  int low=0;  int mid=0; int high=n-1;
        while(mid<=high){
            if(nums[mid]==0){
                swap(nums[low],nums[mid]);
                low++;   mid++;
            }
            else if(nums[mid]==1){
                mid++;
            }
            else{
               swap(nums[mid],nums[high]);
               high--;
            }
        }
        
    }
};


// Complexity Analysis
// Time Complexity: O(N), where N = size of the given array.
// Reason: We are using a single loop that can run at most N times.

// Space Complexity: O(1) as we are not using any extra space.
