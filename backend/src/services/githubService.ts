import axios from 'axios';

/**
 * GitHub API와 통신하여 데이터를 가져오는 서비스 (v3 확장 버전)
 */
export const githubService = {
    /**
     * 사용자의 리포지토리 목록을 가져옵니다.
     */
    fetchUserRepos: async (token: string) => {
        try {
            const response = await axios.get('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
                params: { per_page: 100, sort: 'updated' },
            });
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
                params: { state: 'all', per_page: 20 },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch pull requests');
        }
    },

    /**
     * [신규] 최근 커밋(Push) 목록을 가져옵니다.
     */
    fetchCommits: async (token: string, owner: string, repo: string) => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
                params: { per_page: 20 },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch commits');
        }
    },

    /**
     * [신규] 특정 커밋의 변경 사항(Diff)을 가져옵니다.
     */
    fetchCommitDiff: async (token: string, owner: string, repo: string, sha: string) => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3.diff',
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch commit diff');
        }
    },

    /**
     * [신규] 리포지토리의 파일 트리 구조를 가져옵니다.
     */
    fetchFileTree: async (token: string, owner: string, repo: string, branch: string = 'main'): Promise<any[]> => {
        try {
            // 브랜치의 최신 트리를 가져오기 위해 먼저 브랜치 정보를 조회
            const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
            });
            const treeSha = branchRes.data.commit.commit.tree.sha;

            // 재귀적으로 트리 구조 조회
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return response.data.tree;
        } catch (error: any) {
            // main 브랜치가 없으면 master 시도
            if (branch === 'main') return githubService.fetchFileTree(token, owner, repo, 'master');
            throw new Error('Failed to fetch file tree');
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
                    Accept: 'application/vnd.github.v3.diff',
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch pull request diff');
        }
    },

    /**
     * 특정 리포지토리의 파일 내용을 가져옵니다.
     */
    fetchRepoContent: async (token: string, owner: string, repo: string, path: string = '') => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch repository content');
        }
    }
};
