/**
 * Mock repository data for tests
 * 
 * These fixtures simulate GitHub API responses for repositories
 */

export const mockRepos = [
  {
    id: 1,
    name: "repo1",
    full_name: "owner1/repo1",
    owner: {
      login: "owner1",
      id: 101,
      avatar_url: "https://example.com/avatar1.png",
      url: "https://api.github.com/users/owner1",
      html_url: "https://github.com/owner1"
    },
    description: "Test repository 1",
    html_url: "https://github.com/owner1/repo1",
    fork: false,
    url: "https://api.github.com/repos/owner1/repo1",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2022-01-01T00:00:00Z",
    pushed_at: "2022-01-01T00:00:00Z",
    stargazers_count: 100,
    watchers_count: 10,
    language: "TypeScript",
    forks_count: 5,
    archived: false,
    disabled: false,
    license: {
      key: "mit",
      name: "MIT License",
      url: "https://api.github.com/licenses/mit"
    },
    topics: ["typescript", "deno", "api"]
  },
  {
    id: 2,
    name: "repo2",
    full_name: "owner2/repo2",
    owner: {
      login: "owner2",
      id: 102,
      avatar_url: "https://example.com/avatar2.png",
      url: "https://api.github.com/users/owner2",
      html_url: "https://github.com/owner2"
    },
    description: "Test repository 2",
    html_url: "https://github.com/owner2/repo2",
    fork: false,
    url: "https://api.github.com/repos/owner2/repo2",
    created_at: "2020-02-01T00:00:00Z",
    updated_at: "2022-02-01T00:00:00Z",
    pushed_at: "2022-02-01T00:00:00Z",
    stargazers_count: 200,
    watchers_count: 20,
    language: "JavaScript",
    forks_count: 10,
    archived: false,
    disabled: false,
    license: null,
    topics: ["javascript", "web"]
  },
  {
    id: 3,
    name: "repo3",
    full_name: "owner3/repo3",
    owner: {
      login: "owner3",
      id: 103,
      avatar_url: "https://example.com/avatar3.png",
      url: "https://api.github.com/users/owner3",
      html_url: "https://github.com/owner3"
    },
    description: "Test repository 3",
    html_url: "https://github.com/owner3/repo3",
    fork: true,
    url: "https://api.github.com/repos/owner3/repo3",
    created_at: "2020-03-01T00:00:00Z",
    updated_at: "2022-03-01T00:00:00Z",
    pushed_at: "2022-03-01T00:00:00Z",
    stargazers_count: 300,
    watchers_count: 30,
    language: "Python",
    forks_count: 15,
    archived: false,
    disabled: false,
    license: {
      key: "apache-2.0",
      name: "Apache License 2.0",
      url: "https://api.github.com/licenses/apache-2.0"
    },
    topics: ["python", "machine-learning"]
  },
  {
    id: 4,
    name: "repo4",
    full_name: "owner4/repo4",
    owner: {
      login: "owner4",
      id: 104,
      avatar_url: "https://example.com/avatar4.png",
      url: "https://api.github.com/users/owner4",
      html_url: "https://github.com/owner4"
    },
    description: "Test repository 4",
    html_url: "https://github.com/owner4/repo4",
    fork: false,
    url: "https://api.github.com/repos/owner4/repo4",
    created_at: "2020-04-01T00:00:00Z",
    updated_at: "2021-04-01T00:00:00Z", // Older update
    pushed_at: "2021-04-01T00:00:00Z", // Older push
    stargazers_count: 400,
    watchers_count: 40,
    language: "Go",
    forks_count: 20,
    archived: false,
    disabled: false,
    license: null,
    topics: ["golang", "cli"]
  },
  {
    id: 5,
    name: "archived-repo",
    full_name: "owner5/archived-repo",
    owner: {
      login: "owner5",
      id: 105,
      avatar_url: "https://example.com/avatar5.png",
      url: "https://api.github.com/users/owner5",
      html_url: "https://github.com/owner5"
    },
    description: "This repository is archived",
    html_url: "https://github.com/owner5/archived-repo",
    fork: false,
    url: "https://api.github.com/repos/owner5/archived-repo",
    created_at: "2019-05-01T00:00:00Z",
    updated_at: "2020-05-01T00:00:00Z",
    pushed_at: "2020-05-01T00:00:00Z",
    stargazers_count: 500,
    watchers_count: 50,
    language: "Rust",
    forks_count: 25,
    archived: true, // This repo is archived
    disabled: false,
    license: {
      key: "mit",
      name: "MIT License",
      url: "https://api.github.com/licenses/mit"
    },
    topics: ["rust", "systems"]
  }
];

// Mock API responses for pagination testing
export const createPaginatedRepos = (totalRepos: number, perPage = 30) => {
  const pages: any[] = [];
  for (let i = 0; i < Math.ceil(totalRepos / perPage); i++) {
    const pageRepos = [];
    for (let j = 0; j < Math.min(perPage, totalRepos - i * perPage); j++) {
      const repoIndex = i * perPage + j;
      pageRepos.push({
        id: 1000 + repoIndex,
        name: `paginated-repo-${repoIndex}`,
        full_name: `owner/paginated-repo-${repoIndex}`,
        owner: {
          login: "owner",
          id: 500,
          avatar_url: "https://example.com/avatar.png",
          url: "https://api.github.com/users/owner",
          html_url: "https://github.com/owner"
        },
        description: `Paginated test repository ${repoIndex}`,
        html_url: `https://github.com/owner/paginated-repo-${repoIndex}`,
        fork: false,
        url: `https://api.github.com/repos/owner/paginated-repo-${repoIndex}`,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        pushed_at: "2022-01-01T00:00:00Z",
        stargazers_count: 100 + repoIndex,
        watchers_count: 10 + repoIndex,
        language: "TypeScript",
        forks_count: 5,
        archived: false,
        disabled: false,
        license: null,
        topics: ["test", "pagination"]
      });
    }
    
    // Add pagination links in headers
    const headers: Record<string, string> = {};
    
    if (i > 0) {
      const prevPage = i;
      headers.link = `<https://api.github.com/user/starred?page=${prevPage}&per_page=${perPage}>; rel="prev"`;
    }
    
    if (i < Math.ceil(totalRepos / perPage) - 1) {
      const nextPage = i + 2;
      if (headers.link) {
        headers.link += `, <https://api.github.com/user/starred?page=${nextPage}&per_page=${perPage}>; rel="next"`;
      } else {
        headers.link = `<https://api.github.com/user/starred?page=${nextPage}&per_page=${perPage}>; rel="next"`;
      }
    }
    
    pages.push({
      body: pageRepos,
      headers
    });
  }
  
  return pages;
};

// Error response fixtures
export const errorResponses = {
  notFound: {
    status: 404,
    body: {
      message: "Not Found",
      documentation_url: "https://docs.github.com/rest"
    }
  },
  
  rateLimited: {
    status: 403,
    body: {
      message: "API rate limit exceeded",
      documentation_url: "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
    },
    headers: {
      "x-ratelimit-limit": "60",
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": (Math.floor(Date.now() / 1000) + 60).toString() // Reset in 60 seconds
    }
  },
  
  unauthorized: {
    status: 401,
    body: {
      message: "Bad credentials",
      documentation_url: "https://docs.github.com/rest"
    }
  },
  
  validationFailed: {
    status: 422,
    body: {
      message: "Validation Failed",
      errors: [
        {
          resource: "Repository",
          field: "name",
          code: "missing"
        }
      ],
      documentation_url: "https://docs.github.com/rest"
    }
  }
};