{
  description = "Vim-style word completion for the OpenCode TUI prompt";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      each = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
      version = (builtins.fromJSON (builtins.readFile ./package.json)).version;
    in
    {
      packages = each (pkgs: {
        default = pkgs.stdenvNoCC.mkDerivation {
          pname = "opencode-wordcomplete";
          inherit version;
          src = self;
          nativeBuildInputs = [ pkgs.esbuild ];
          dontConfigure = true;
          buildPhase = ''
            runHook preBuild
            esbuild src/index.ts src/tui.tsx \
              --bundle --format=esm --platform=node \
              --jsx=automatic --jsx-import-source=@opentui/solid \
              --outdir=dist \
              --external:@opentui/core \
              --external:@opentui/solid \
              --external:@opentui/keymap \
              --external:solid-js \
              --external:@opencode/plugin \
              --external:bun:sqlite
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p $out/dist
            cp dist/index.js dist/tui.js $out/dist/
            cp package.json README.md CHANGELOG.md LICENSE $out/
            runHook postInstall
          '';
        };
      });

      checks = each (pkgs: {
        build = self.packages.${pkgs.system}.default;

        test = pkgs.stdenvNoCC.mkDerivation {
          pname = "opencode-wordcomplete-test";
          inherit version;
          src = self;
          nativeBuildInputs = [ pkgs.bun ];
          dontConfigure = true;
          dontBuild = true;
          doCheck = true;
          checkPhase = ''
            runHook preCheck
            export HOME=$TMPDIR
            export XDG_CACHE_HOME=$TMPDIR/cache
            bun test
            runHook postCheck
          '';
          installPhase = "touch $out";
        };

        coverage = pkgs.stdenvNoCC.mkDerivation {
          pname = "opencode-wordcomplete-coverage";
          inherit version;
          src = self;
          nativeBuildInputs = [ pkgs.bun ];
          dontConfigure = true;
          dontBuild = true;
          doCheck = true;
          checkPhase = ''
            runHook preCheck
            export HOME=$TMPDIR
            export XDG_CACHE_HOME=$TMPDIR/cache
            bun test --coverage --coverage-reporter=lcov --coverage-dir=$TMPDIR/coverage
            bun scripts/coverage-gate.ts $TMPDIR/coverage/lcov.info
            runHook postCheck
          '';
          installPhase = "touch $out";
        };

        pack = pkgs.stdenvNoCC.mkDerivation {
          pname = "opencode-wordcomplete-pack";
          inherit version;
          src = self;
          nativeBuildInputs = [
            pkgs.bun
            pkgs.nodejs
          ];
          dontConfigure = true;
          dontBuild = true;
          doCheck = true;
          checkPhase = ''
            runHook preCheck
            export HOME=$TMPDIR
            export XDG_CACHE_HOME=$TMPDIR/cache
            bun scripts/check-pack.ts
            runHook postCheck
          '';
          installPhase = "touch $out";
        };
      });

      devShells = each (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.nodejs
            pkgs.esbuild
          ];
        };
      });
    };
}
