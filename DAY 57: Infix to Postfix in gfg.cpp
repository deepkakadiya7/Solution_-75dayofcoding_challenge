class Solution {
  public:
    // Function to convert an infix expression to a postfix expression.
    string infixToPostfix(string s) {
        // Your code here
        string ans="";
        stack<char>st;
        unordered_map<char,int>mpp;
        mpp['^']=5;
        mpp['*']=4;
        mpp['/']=4;
        mpp['+']=3;
        mpp['-']=3;
        
        for(int i=0;i<s.size();i++){
            if(st.empty()&&(s[i]=='+'||s[i]=='-'  ||s[i]=='^'||s[i]=='*'||s[i]=='/')){
                st.push(s[i]);
            }
            else if(s[i]=='('){
                st.push(s[i]);
            }
            else if(s[i]==')'){
                while(!st.empty()&&st.top()!='('){
                    ans += st.top();
                    st.pop();
                }
                st.pop();
            }
            else if((s[i]>='a'&&s[i]<='z')||(s[i]>='A'&&s[i]<='Z')||(s[i]>='1'&&s[i]<='9')){
                ans += s[i];
            }
            else{
                while(!st.empty()&&mpp[st.top()]>=mpp[s[i]]){
                ans+=st.top();
                st.pop();
                }
                st.push(s[i]);
            }
            
            
        }
        while(!st.empty()){
            ans += st.top();
            st.pop();
        }
        return ans;
    }
};
