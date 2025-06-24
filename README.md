## Experimental NextJs client for audiobookshelf

### How to

This assumes that you have [audiobookshelf](https://github.com/advplyr/audiobookshelf) locally with an initialized server (root user created).

1. git clone https://github.com/audiobookshelf/audiobookshelf-client-react.git
2. install dependencies: `cd audiobookshelf-client-react && npm ci`
3. Start the audiobookshelf server with the `REACT_CLIENT_PATH` env variable set to this project path. Or in the `dev.js` file add `ReactClientPath` to config.
4. In the audiobookshelf server repo run with `npm run dev` as usual. This will serve the NextJS app using HMR.

```js
// example dev.js file in audiobookshelf
const Path = require('path')

module.exports.config = {
  ConfigPath: Path.resolve('config'),
  MetadataPath: Path.resolve('metadata'),
  ReactClientPath: Path.resolve('../audiobookshelf-client-react')
}
```
