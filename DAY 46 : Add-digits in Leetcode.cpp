class Solution {
public:
    int addDigits(int num) {
         int x= num;
      while(x>9){
         int sum =0;
          int last ;
        while(x != 0){
         last = x%10;
            sum=sum+last;
            x=x/10;
        }
        x=sum;
      }
      return x;
    }
};


