const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

module.exports = async (req, res) => {
    const { slug } = req.query;

    // Only plain post names, so the path can never leave content/blog
    if (typeof slug !== 'string' || !/^[a-z0-9-]{1,120}$/.test(slug)) {
        return res.status(400).json({ error: 'A valid slug is required' });
    }

    const postsDirectory = path.join(process.cwd(), 'content/blog');
    const filePath = path.join(postsDirectory, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Post not found' });
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    // Convert markdown body to HTML
    const htmlContent = marked.parse(content);

    res.status(200).json({
        slug,
        ...data,
        content: htmlContent
    });
};
