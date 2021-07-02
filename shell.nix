with import <nixpkgs> {};

# Hotfix because prisma engines don't support nix
# https://github.com/prisma/prisma/issues/3026
let
	prismaDrv = {stdenv,fetchurl,openssl,zlib,autoPatchelfHook,lib} :
		let
			hostname = "binaries.prisma.sh";
			channel = "all_commits";
			target = "debian-openssl-1.1.x";
			baseUrl = "https://${hostname}/${channel}";
			# Fetched from https://github.com/prisma/prisma-engines/releases/tag/${version}
			commit = "9b816b3aa13cc270074f172f30d6eda8a8ce867d";
			# Fetched from https://binaries.prisma.sh/all_commits/${commit}/debian-openssl-1.1.x/${engine-name}.sha256
			hashes = {
				introspection-engine = "33c0b4875647ebe3a3e2030a2c2ef255945f1b88ffd7c2d309ab4a87d5349d93";
				migration-engine = "452a75f79e5bcb50a0d549da44d6850e8393ece4e9cd69202b72253a2df7db8e";
				prisma-fmt = "8546453533a150d014e18c61c92c021e36e4e0b91ba810c0f6d5f414de9e19a5";
				query-engine = "3fdbe4e0f99a85d0ed66a9e376725c6224b3ae4875957e03b2744c53e450b20f";
			};
			files = lib.mapAttrs (name: sha256: fetchurl {
				url = "${baseUrl}/${commit}/${target}/${name}.gz";
				inherit sha256;
			}) hashes;
			unzipCommands = lib.mapAttrsToList (name: file: "gunzip -c ${file} > $out/bin/${name}") files;
		in
		stdenv.mkDerivation rec {
			pname = "prisma-bin";
			version = "2.19.0";
			nativeBuildInputs = [
				autoPatchelfHook
				zlib
				openssl
			];
			phases = ["buildPhase" "postFixupHooks" ];
			buildPhase = ''
				mkdir -p $out/bin
				${lib.concatStringsSep "\n" unzipCommands}
				chmod +x $out/bin/*
			'';
		};

	prismaPkg = callPackage prismaDrv {};

in mkShell {
	buildInputs = [
		prismaPkg
		git
		nodejs-16_x
		nodePackages.npm
	];
	shellHook = ''
		export PRISMA_MIGRATION_ENGINE_BINARY="${prismaPkg}/bin/migration-engine"
		export PRISMA_QUERY_ENGINE_BINARY="${prismaPkg}/bin/query-engine"
		export PRISMA_INTROSPECTION_ENGINE_BINARY="${prismaPkg}/bin/introspection-engine"
		export PRISMA_FMT_BINARY="${prismaPkg}/bin/prisma-fmt"
		export PATH="$PATH:$PWD/node_modules/.bin"
	'';
}