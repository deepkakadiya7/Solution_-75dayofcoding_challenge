class Solution {
public:
    vector<vector<int>> buildMatrix(int k, vector<vector<int>>& rowConditions, vector<vector<int>>& colConditions) {
        vector<vector<int>> ans(k, vector<int>(k, 0));

        auto topological = [&](vector<vector<int>>& conditions) -> vector<int> {
            unordered_map<int, vector<int>> graph;
            vector<int> indegree(k, 0);

            for (auto& condition : conditions) {
                int a = condition[0];
                int b = condition[1];
                graph[a].push_back(b);
                indegree[b - 1]++;
            }

            queue<int> q;
            for (int i = 0; i < k; ++i) {
                if (indegree[i] == 0) {
                    q.push(i + 1);
                }
            }

            vector<int> order;
            while (!q.empty()) {
                int temp = q.front();
                q.pop();
                order.push_back(temp);
                for (int child : graph[temp]) {
                    indegree[child - 1]--;
                    if (indegree[child - 1] == 0) {
                        q.push(child);
                    }
                }
            }

            return order;
        };

        vector<int> row_order = topological(rowConditions);
        vector<int> col_order = topological(colConditions);

        if (row_order.size() < k || col_order.size() < k) {
            return {};
        }

        for (int row = 0; row < k; ++row) {
            int val = row_order[row];
            auto it = find(col_order.begin(), col_order.end(), val);
            int col = distance(col_order.begin(), it);
            ans[row][col] = val;
        }

        return ans;
    }
};
