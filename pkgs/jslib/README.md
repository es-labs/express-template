## Description

Shared Javascript ES Module library for Javascript applications (node, express, web, isomorphic)

- web
- node
- iso
- express
- auth: authorization
- comms:  for communications
- express: for express JS
- services: various services
  - db:
    - mysql
    - postgres
  - mq: TODO
  - others:
    - keyv
    - redis/valkey
    - webpush
    - websocket
  - cloud:
    - aliyun:
      - bucket (oss)
    - aws:
      - bucket (s3)
- t4t: table editor
- utils: various utilities
  - aes: encrypt & decrypt
- config.js: config loader
- package.json
- packageInfo.js: some package information for now
- README.md
- traps.js: error trapping

Refer to [https://github.com/es-labs/express-template]() project for usage

## TODO

- setup github actions to auto increment package json version for `libs/node` & `libs/esm` when deploying to npm
  - https://aboutbits.it/blog/2021-03-11-using-github-actions-to-perfom-npm-version-increment
- setup unit tests
