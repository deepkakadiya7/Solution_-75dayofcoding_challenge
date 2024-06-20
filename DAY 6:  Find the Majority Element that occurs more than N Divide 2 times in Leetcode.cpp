class Solution {
public:
    int majorityElement(vector<int>& nums) {
         int n = nums.size();  int cnt = 0;  int el; 
    for (int i = 0; i < n; i++) {
        if (cnt == 0) {
            cnt = 1;
            el = nums[i];
        }
        else if (el == nums[i]) cnt++;
        else cnt--;
    }
    int cnt1 = 0;
    for (int i = 0; i < n; i++) {
        if (nums[i] == el) cnt1++;
    }

    if (cnt1 > (n / 2)) return el;
    return -1;
    }
};

// Time Complexity: O(N) + O(N), where N = size of the given array.
// Reason: The first O(N) is to calculate the count and find the expected majority element. The second one is to check if the expected element is the majority one or not.

// Note: If the question states that the array must contain a majority element, in that case, we do not need the second check. Then the time complexity will boil down to O(N).

// Space Complexity: O(1) as we are not using any extra space.
