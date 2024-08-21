class Solution {
  public:
    int countNodes(int i) {
        // your code here
         if(i == 1) return 1;
        return 2*countNodes(i-1);
    }
};

//{ Driver Code Starts.

int main() {
    int t;
    cin >> t;
    while (t--) {
        int i;
        cin >> i;
        Solution ob;
        int res = ob.countNodes(i);

        cout << res;
        cout << "\n";
    }
}
