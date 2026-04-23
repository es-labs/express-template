<?php
$config = [
    'admin' => [
        'core:AdminPassword',
    ],
    'example-userpass' => [
        'exampleauth:UserPass',
        'testuser:password' => [
            'uid'                  => ['testuser'],
            'eduPersonAffiliation' => ['member', 'employee'],
        ],
    ],
];
