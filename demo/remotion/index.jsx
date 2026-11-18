import { Composition, registerRoot } from "remotion";
import { Demo, durationOf, FPS } from "./Demo";
import { MANIFESTS } from "./manifests";

function Root() {
  return (
    <>
      {Object.keys(MANIFESTS).map((lang) => (
        <Composition
          key={lang}
          id={`demo-${lang}`}
          component={Demo}
          defaultProps={{ lang }}
          durationInFrames={durationOf()}
          fps={FPS}
          width={1920}
          height={1200}
        />
      ))}
    </>
  );
}

registerRoot(Root);
