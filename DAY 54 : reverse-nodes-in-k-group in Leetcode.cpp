
class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        stack<ListNode*> st;
        ListNode* temp = head;
        ListNode* ans = new ListNode();
        ListNode* dummy = ans;

        int ind = k;

        ListNode* cur = head;
        int cnt = 0;
        while (cur) {
            cnt++;
            cur = cur->next;
        }


        while(cnt >= k){
            int remaining = k;
            while (remaining > 0 && temp) {
                st.push(temp);
                cout << temp -> val;
                temp = temp->next;
                remaining--;
            }
            
            while (!st.empty()) {
                ListNode* node = st.top();
                st.pop();
                dummy->next = node; 
                dummy = dummy->next;
            }
            cnt -= k;
        }
        
        dummy -> next = temp;

        return ans -> next;
    }
};


int init = [](){
    ios_base::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    return 0;
}();
