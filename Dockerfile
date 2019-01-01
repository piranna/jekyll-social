FROM node

LABEL "com.github.actions.name"="Jekyll Social"
LABEL "com.github.actions.description"="Publish your Jekyll posts on several social networks and include the URL in the frontmatter"
LABEL "com.github.actions.icon"="share-2"
LABEL "com.github.actions.color"="red"

LABEL "repository"="https://github.com/piranna/jekyll-social"
LABEL "homepage"="https://github.com/piranna/jekyll-social#readme"
LABEL "maintainer"="Jesús Leganés-Combarro 'piranna' <piranna@gmail.com>"

# `npm` don't support easily to define a target install directory
WORKDIR /
COPY package*.json ./
RUN npm install
COPY . .
WORKDIR /github/workspace

ENTRYPOINT [ "/server.js" ]
