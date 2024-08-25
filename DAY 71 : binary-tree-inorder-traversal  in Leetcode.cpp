class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> result;
        inorderHelper(root, result);
        return result;
    }
    
private:
    void inorderHelper(TreeNode* node, vector<int>& result) {
        if (node == nullptr) {
            return;
        }
        
        inorderHelper(node->left, result);  // Traverse left subtree
        result.push_back(node->val);        // Visit node
        inorderHelper(node->right, result); // Traverse right subtree
    }
};
