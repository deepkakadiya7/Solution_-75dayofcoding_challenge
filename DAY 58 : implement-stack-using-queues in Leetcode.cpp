class MyStack {
public:
 queue<int> q1;
    queue<int> q2;
    MyStack() {
        
    }
    
    void push(int x) {
      
        if(q1.empty()){
            q1.push(x);
        }

        else{
            while(!q1.empty()){
                int data = q1.front();
                q1.pop();
                q2.push(data);
            }
         
            q1.push(x);

            while(!q2.empty()){
                int val = q2.front();
                q2.pop();
                q1.push(val);
            }
        }
    }
    
    int pop() {
         int element = q1.front();
        q1.pop();
        return element;
    }
    
    int top() {
        int element = q1.front();
        return element;
    }
    
    bool empty() {
        if(q1.size()==0){
            return true;
        }
        else{
            return false;
        }
    }
};

