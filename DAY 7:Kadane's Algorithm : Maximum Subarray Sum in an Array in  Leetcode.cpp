class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int n =nums.size();
        int sum=0;
        int maxi=INT_MIN;
        for(int i=0;i<n;i++){
            sum=sum + nums[i];
            maxi=max(sum,maxi);
             if (sum < 0) {
            sum = 0;
        }
        }return maxi;
    }
};



// Complexity Analysis
// Time Complexity: O(N), where N = size of the array.
// Reason: We are using a single loop running N times.

// Space Complexity: O(1) as we are not using any extra space.
