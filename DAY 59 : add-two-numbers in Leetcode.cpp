
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode* temp1=l1;
        ListNode* temp2=l2;
        ListNode* dummy = new ListNode();
         ListNode* cur = new ListNode();
         cur = dummy;

        int carry =0;
        int sum=0;
        
        while(l1 != nullptr  ||   l2 != nullptr || carry){

            sum=carry;
            if(l1 != nullptr){
                sum = sum+ l1->val;
            }
             if(l2 != nullptr){
                sum = sum+ l2->val;
            }
           if(l1)
            l1=l1->next;

            if(l2)
            l2=l2->next;

           carry = sum /10;
            dummy->next = new ListNode(sum%10);
            dummy = dummy->next;

        }
        return cur->next; 
    }

};
