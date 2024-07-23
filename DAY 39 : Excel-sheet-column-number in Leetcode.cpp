class Solution {
    public int titleToNumber(String columnTitle) {
        int out = 0;
        for (int i = 0; i < columnTitle.length(); i++) {
            out = out * 26 + (columnTitle.charAt(i) - 'A' + 1);
        }
        return out;
    }
}
