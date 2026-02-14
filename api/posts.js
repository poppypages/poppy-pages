const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

module.exports = async (req, res) => {
    const postsDirectory = path.join(process.cwd(), 'content/blog');

    if (!fs.existsSync(postsDirectory)) {
        return res.status(200).json([]);
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
        .filter(fileName => fileName.endsWith('.md'))
        .map(fileName => {
            const slug = fileName.replace(/\.md$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data } = matter(fileContents);

            return {
                slug,
                ...data,
            };
        })
        // Sort posts by date
        .sort((a, b) => {
            if (a.date < b.date) {
                return 1;
            } else {
                return -1;
            }
        });

    res.status(200).json(allPostsData);
};
