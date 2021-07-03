# go.hack.af

> [Hack Club](https://hackclub.com)’s Postgres-Based Link Shortener

## Setup

### Dependencies

Using [Nix](https://nixos.org/), run

> nix-shell

Otherwise, you'll need:

- `nodejs`
- `npm`

### Deployment

- Create a postgres database
- Add its `DATABASE_URL` to your environment
- Run `npx prisma migrate deploy` to configure your database

### Options

- Set `LOGGING` to `on` if you want to enable logging, `off` if otherwise.
- Set `BOT_LOGGING` to `on` if you want to enable logging for crawlers, `off` if otherwise.
- Set `CACHE_EXPIRATION` to the number of seconds you want the local cache to be valid.

## Usage

All links will be routed through a 302 (Temporary Redirect). Simply visit `example.com/slug` to get redirected.

## License

This project is released under [the MIT license](LICENSE).
