import { toValue, UnitValue, type RgbValue } from "@webstudio-is/css-engine";
import { Root, Range, Thumb, Track } from "@radix-ui/react-slider";
import { useState, useCallback } from "react";
import {
  reconstructLinearGradient,
  type GradientStop,
  type ParsedGradient,
} from "@webstudio-is/css-data";
import { styled, theme, Flex } from "@webstudio-is/design-system";
import { ChevronBigUpIcon } from "@webstudio-is/icons";
import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";

extend([mixPlugin]);

type GradientControlProps = {
  gradient: ParsedGradient;
  onChange: (value: ParsedGradient) => void;
};

const defaultAngle: UnitValue = {
  type: "unit",
  value: 90,
  unit: "deg",
};

export const GradientControl = (props: GradientControlProps) => {
  const [stops, setStops] = useState<Array<GradientStop>>(props.gradient.stops);
  const [selectedStop, setSelectedStop] = useState<number | undefined>();
  const positions = stops
    .map((stop) => stop.position?.value)
    .filter((item) => item !== undefined);
  const hints = props.gradient.stops
    .map((stop) => stop.hint?.value)
    .filter((item) => item !== undefined);
  const background = reconstructLinearGradient({
    stops,
    sideOrCorner: props.gradient.sideOrCorner,
    angle: defaultAngle,
  });

  // Every color stop should have a asociated position for us in-order to display the slider thumb.
  // But when users manually enter linear-gradient from the advanced-panle. They might add something like this
  // linear-gradient(to right, red, blue), or linear-gradient(150deg, red, blue 50%, yellow 50px)
  // Browsers handles all these cases by following the rules of the css spec.
  // https://www.w3.org/TR/css-images-4/#color-stop-fixup
  // In order to handle such examples from the advanced tab too. We need to implement the color-stop-fix-up spec during parsing.
  // But for now, we are just checking if every stop has a position or not. Since the main use-case if to add gradients from ui.
  // We will never run into this case of a color-stop missing a position associated with it.
  const isEveryStopHasAPosition = stops.every(
    (stop) => stop.position !== undefined && stop.color !== undefined
  );

  const handleValueChange = useCallback(
    (newPositions: number[]) => {
      const newStops: GradientStop[] = stops.map((stop, index) => ({
        ...stop,
        position: { type: "unit", value: newPositions[index], unit: "%" },
      }));

      setStops(newStops);
      props.onChange({
        angle: props.gradient.angle,
        stops: newStops,
        sideOrCorner: props.gradient.sideOrCorner,
      });
    },
    [stops, props]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Backspace" && selectedStop !== undefined) {
        const newStops = stops;
        newStops.splice(selectedStop, 1);
        setStops(newStops);
        setSelectedStop(undefined);
      }
    },
    [stops, selectedStop]
  );

  const handlePointerDown = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      if (event.target === undefined || event.target === null) {
        return;
      }

      // radix-slider automatically brings the closest thumb to the clicked position.
      // But, we want it be prevented. So, we can add a new color-stop where the user is cliked.
      // And handle the even for scrubing when the user is dragging the thumb.
      const sliderWidth = event.currentTarget.offsetWidth;
      const clickedPosition =
        event.clientX - event.currentTarget.getBoundingClientRect().left;
      const newPosition = Math.ceil((clickedPosition / sliderWidth) * 100);
      const isExistingPosition = positions.some(
        (position) => Math.abs(newPosition - position) <= 8
      );

      if (isExistingPosition === true) {
        return;
      }

      event.preventDefault();
      const newStopIndex = positions.findIndex(
        (position) => position > newPosition
      );

      const index = newStopIndex === -1 ? stops.length : newStopIndex;
      const prevColor = stops[index === 0 ? 0 : index - 1].color;
      const nextColor =
        stops[index === positions.length ? index - 1 : index].color;

      const interpolationColor = colord(toValue(prevColor))
        .mix(colord(toValue(nextColor)), newPosition / 100)
        .toRgb();

      const newColorStop: RgbValue = {
        type: "rgb",
        alpha: interpolationColor.a,
        r: interpolationColor.r,
        g: interpolationColor.g,
        b: interpolationColor.b,
      };

      const newStops: GradientStop[] = [
        ...stops.slice(0, index),
        {
          color: newColorStop,
          position: { type: "unit", value: newPosition, unit: "%" },
        },
        ...stops.slice(index),
      ];
      setStops(newStops);
    },
    [stops, positions]
  );

  if (isEveryStopHasAPosition === false) {
    return;
  }

  return (
    <Flex
      align="end"
      css={{
        width: theme.spacing[28],
        height: theme.spacing[14],
      }}
    >
      <SliderRoot
        css={{ background }}
        max={100}
        step={1}
        value={positions}
        onValueChange={handleValueChange}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
      >
        <Track>
          <SliderRange css={{ cursor: "copy" }} />
        </Track>
        {stops.map((stop, index) => (
          <SliderThumb
            key={index}
            onClick={() => {
              setSelectedStop(index);
            }}
            style={{
              background: toValue(stop.color),
            }}
          />
        ))}

        {/*
            Hints are displayed as a chevron icon below the slider thumb.
            Usually hints are used to display the behaviour of the color-stop that is preciding.
            But, if we just move them along the UI. We will be basically altering the gradient itself.
            Because the position of the hint is the position of the color-stop. And moving it along, might associate the hint
            with a different color-stop. So, we are not allowing the user to move the hint along the slider.

            None of the tools are even displaying the hints at the moment. We are just displaying them so users can know
            they are hints associated with stops if they managed to add gradient from the advanced tab.
        */}
        {hints.map((hint) => {
          return (
            <Flex
              key={hint}
              align="center"
              justify="center"
              css={{
                position: "absolute",
                left: `${hint}%`,
                top: theme.spacing[9],
              }}
            >
              <ChevronBigUpIcon color={theme.colors.borderMain} />
            </Flex>
          );
        })}
      </SliderRoot>
    </Flex>
  );
};

const SliderRoot = styled(Root, {
  position: "relative",
  width: "100%",
  height: theme.spacing[9],
  border: `1px solid ${theme.colors.borderInfo}`,
  borderRadius: theme.borderRadius[3],
  touchAction: "none",
  userSelect: "none",
});

const SliderRange = styled(Range, {
  position: "absolute",
  background: "transparent",
  borderRadius: theme.borderRadius[3],
});

const SliderThumb = styled(Thumb, {
  position: "absolute",
  width: theme.spacing[9],
  height: theme.spacing[9],
  border: `1px solid ${theme.colors.borderInfo}`,
  borderRadius: theme.borderRadius[3],
  top: `-${theme.spacing[11]}`,
  translate: "-9px",
});

export default GradientControl;
