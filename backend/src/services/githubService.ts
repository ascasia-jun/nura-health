import axios from 'axios';

/**
 * GitHub API와 통신하여 데이터를 가져오는 서비스
 */
export const githubService = {
    /**
     * 사용자의 리포지토리 목록을 가져옵니다.
     * @param token GitHub Personal Access Token
     */
    fetchUserRepos: async (token: string) => {
        try {
            console.log('>>> [GITHUB SERVICE] Attempting to fetch repos with token');
            const response = await axios.get('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
                params: {
                    per_page: 100,
                    sort: 'updated'
                    // 모든 필터 제거: GitHub API 기본 동작에 맡김
                },
            });
            console.log(`>>> [GITHUB SERVICE] Found ${response.data.length} repositories`);
            return response.data;
        } catch (error: any) {

            console.error('GitHub API Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch repositories from GitHub');
        }
    },

    /**
     * 특정 리포지토리의 Pull Request 목록을 가져옵니다.
     */
    fetchPullRequests: async (token: string, owner: string, repo: string) => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
                params: { state: 'open', per_page: 10 },
            });
            return response.data;
        } catch (error: any) {
            console.error('GitHub PR Fetch Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch pull requests');
        }
    },

    /**
     * 특정 PR의 변경 사항(Diff)을 가져옵니다.
     */
    fetchPullRequestDiff: async (token: string, owner: string, repo: string, pullNumber: number) => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3.diff', // Diff 형식을 요청
                },
            });
            return response.data;
        } catch (error: any) {
            console.error('GitHub PR Diff Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch pull request diff');
        }
    },

    /**
     * 특정 리포지토리의 파일 내용을 가져옵니다. (AI 분석용)
     */
    fetchRepoContent: async (token: string, owner: string, repo: string, path: string = '') => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return response.data;
        } catch (error: any) {
            console.error('GitHub Content Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch repository content');
        }
    }
};
