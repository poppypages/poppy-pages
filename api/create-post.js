const https = require('https');
const { safeEqual } = require('./_lib/oauth');

// Helper: Make a GitHub API request
function githubRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'User-Agent': 'PoppyPages-CMS',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
        };
        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseData) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// Slugify a title
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 80);
}

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Authenticate with a secret key (set in Vercel env vars)
    // Refuse everything unless a long secret is set, and compare it in constant time
    const secret = process.env.CREATE_POST_SECRET;
    if (!secret || secret.length < 32 || !process.env.GITHUB_TOKEN) {
        return res.status(503).json({ error: 'Posting by API is turned off.' });
    }
    const authHeader = String(req.headers['authorization'] || '');
    const expectedKey = `Bearer ${secret}`;

    if (!safeEqual(authHeader, expectedKey)) {
        return res.status(401).json({ error: 'Unauthorized. Invalid or missing API key.' });
    }

    // Parse the incoming post data
    const {
        title,
        body,           // Markdown content from Substack (or ChatGPT reformatted)
        description,    // Short excerpt for SEO
        author,         // Optional, defaults to "PoppyPages Team"
        thumbnail,      // Optional image URL
        llm_summary,    // Optional LLM summary from ChatGPT
        schema_type,    // Optional: BlogPosting, Article, NewsArticle
        date,           // Optional: ISO date string, defaults to now
    } = req.body;

    const oneLine = (v) => String(v || '').replace(/[\r\n]+/g, ' ').trim();
    if (!title || !body) {
        return res.status(400).json({ error: 'Missing required fields: title, body' });
    }

    // Build frontmatter
    const now = date && !isNaN(Date.parse(date)) ? new Date(date).toISOString() : new Date().toISOString();
    const slug = slugify(title);
    const fileName = `${now.substring(0, 10)}-${slug}`;

    const frontmatter = [
        '---',
        `layout: blog`,
        `title: "${oneLine(title).replace(/"/g, '\\"')}"`,
        `date: ${now}`,
        `author: "${(oneLine(author) || 'PoppyPages Team').replace(/"/g, '\\"')}"`,
    ];

    if (thumbnail) frontmatter.push(`thumbnail: "${oneLine(thumbnail).replace(/"/g, '\\"')}"`);
    if (description) frontmatter.push(`description: "${oneLine(description).replace(/"/g, '\\"')}"`);
    if (llm_summary) frontmatter.push(`llm_summary: "${oneLine(llm_summary).replace(/"/g, '\\"')}"`);
    frontmatter.push(`schema_type: "${['BlogPosting', 'Article', 'NewsArticle'].includes(schema_type) ? schema_type : 'BlogPosting'}"`);
    frontmatter.push('---');

    const fileContent = frontmatter.join('\n') + '\n\n' + body;

    // Base64 encode the content (GitHub API requirement)
    const contentBase64 = Buffer.from(fileContent).toString('base64');

    // Commit to GitHub
    const repoOwner = 'poppypages';
    const repoName = 'poppy-pages';
    const filePath = `content/blog/${fileName}.md`;

    try {
        const result = await githubRequest('PUT', `/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
            message: `New blog post: ${title}`,
            content: contentBase64,
            branch: 'main',
        });

        if (result.status === 201 || result.status === 200) {
            return res.status(201).json({
                success: true,
                message: `Post "${title}" published successfully!`,
                slug: fileName,
                url: `https://www.poppypages.com/blog/${fileName}`,
                github_url: result.data.content?.html_url || null,
            });
        } else {
            console.error('GitHub API Error:', result);
            return res.status(500).json({
                error: 'Failed to create post on GitHub',
                details: result.data,
            });
        }
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
