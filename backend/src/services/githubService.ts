import axios from 'axios';

/**
 * [v3.8 Iteration] GitHub API 통신 서비스 - 토큰 유무에 따른 헤더 자동 최적화
 */
export const githubService = {
    /**
     * 공통 헤더 생성 (토큰이 있을 때만 Bearer 추가)
     */
    getHeaders: (token?: string) => {
        const headers: any = { 'Accept': 'application/vnd.github.v3+json' };
        if (token && token.trim() !== "") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    /**
     * 사용자의 리포지토리 목록을 가져옵니다.
     */
    fetchUserRepos: async (token: string) => {
        try {
            const response = await axios.get('https://api.github.com/user/repos', {
                headers: githubService.getHeaders(token),
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
                headers: githubService.getHeaders(token),
                params: { state: 'all', per_page: 20 },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch pull requests');
        }
    },

    /**
     * 최근 커밋 목록을 가져옵니다.
     */
    fetchCommits: async (token: string, owner: string, repo: string) => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
                headers: githubService.getHeaders(token),
                params: { per_page: 20 },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch commits');
        }
    },

    /**
     * 특정 커밋의 변경 사항(Diff)을 가져옵니다.
     */
    fetchCommitDiff: async (token: string, owner: string, repo: string, sha: string) => {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
                headers: {
                    ...githubService.getHeaders(token),
                    'Accept': 'application/vnd.github.v3.diff',
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error('Failed to fetch commit diff');
        }
    },

    /**
     * 리포지토리의 파일 트리 구조를 가져옵니다.
     */
    fetchFileTree: async (token: string, owner: string, repo: string, branch: string = 'main'): Promise<any[]> => {
        try {
            const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
                headers: githubService.getHeaders(token),
            });
            const treeSha = branchRes.data.commit.commit.tree.sha;

            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
                headers: githubService.getHeaders(token),
            });
            return response.data.tree;
        } catch (error: any) {
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
                    ...githubService.getHeaders(token),
                    'Accept': 'application/vnd.github.v3.diff',
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
                headers: githubService.getHeaders(token),
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to fetch content for: ${path}`);
        }
    },

    /**
     * GitHub Code Search API를 사용하여 내용을 검색합니다.
     */
    searchCode: async (token: string, owner: string, repo: string, query: string) => {
        try {
            const fullQuery = `${query} repo:${owner}/${repo}`;
            const response = await axios.get('https://api.github.com/search/code', {
                headers: githubService.getHeaders(token),
                params: { q: fullQuery, per_page: 20 },
            });
            return response.data.items.map((item: any) => ({ path: item.path, url: item.html_url }));
        } catch (error: any) {
            throw new Error(`Code search failed: ${error.response?.data?.message || error.message}`);
        }
    }
};
