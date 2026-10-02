const LANGUAGE_COLORS = {
    'C': '#555555',
    'C#': '#178600',
    'C++': '#f34b7d',
    'CSS': '#663399',
    'Dockerfile': '#384d54',
    'Go': '#00ADD8',
    'HTML': '#e34c26',
    'Java': '#b07219',
    'JavaScript': '#f1e05a',
    'Kotlin': '#A97BFF',
    'Lua': '#000080',
    'Makefile': '#427819',
    'Markdown': '#083fa1',
    'PHP': '#4F5D95',
    'PowerShell': '#012456',
    'Python': '#3572A5',
    'Ruby': '#701516',
    'Rust': '#dea584',
    'SCSS': '#c6538c',
    'Shell': '#89e051',
    'Svelte': '#ff3e00',
    'Swift': '#F05138',
    'TypeScript': '#3178c6',
    'Vue': '#41b883',
    'Zig': '#ec915c'
};

export function languageColor(name) {
    return LANGUAGE_COLORS[name] || 'var(--violet)';
}
