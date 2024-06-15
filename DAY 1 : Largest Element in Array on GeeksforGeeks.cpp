//**Solution 1 :Brute Force Approach 

class Solution
{
public:
    int largest(vector<int> &arr, int n)
    {
    sort(arr.begin(),arr.end());
    return arr[arr.size()-1];

    }
};

// Complexity Analysis
// Time Complexity: O(N*log(N))

// Space Complexity: O(n)

//**Solution 2 : Recursive Approach

class Solution
{
public:
    int largest(vector<int> &arr, int n)
    {
        int larg=arr[0];
        for(int i =0;i<n;i++){
            
            if(arr[i]>larg){
                larg=arr[i];
            }
        }
            return larg;
    }
};

// Complexity Analysis
// Time Complexity: O(N)

// Space Complexity: O(1)
