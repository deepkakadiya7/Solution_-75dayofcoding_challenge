class Solution {
public:
    int accountBalanceAfterPurchase(int purchaseAmount) {
         int s= 100 - (int)(floor((purchaseAmount + 5) / 10) * 10);
        return s;
    }
};
