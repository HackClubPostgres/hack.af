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
- Copy the `DATABASE_URL`
- Add the `DATABASE_URL` to your vercel settings
- Run `npx prisma migrate deploy` to configure your database
- Deploy with `npx vercel`

## Using

All links will be routed through a 302 (Temporary Redirect). Simply visit `example.com/slug` to get redirected.

## License

This project is released under [the MIT license](LICENSE).
