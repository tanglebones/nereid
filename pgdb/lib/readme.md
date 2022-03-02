# DB "lib"s

Because schema evolves I am adding versions in the paths to allow for eventually doing:

```
.../foo/
  v1/
    index.sql
  v2/
    index.sql
    from/v1/
      migration.sql
  v3/
    index.sql
    from/
      v1/
        migration.sql
      v2/
        migration.sql
```

This structure should let new projects directly use the latest version without having to apply a bunch of migrations.
