class Solution {
public:
    void preOrder(TreeNode* root, std::vector<int>& res) {
        if (root == nullptr) return;

        res.push_back(root->val);
        preOrder(root->left, res);
        preOrder(root->right, res);
    }

    std::vector<int> preorderTraversal(TreeNode* root) {
        std::vector<int> res;
        preOrder(root, res);
        return res;
    }
};
