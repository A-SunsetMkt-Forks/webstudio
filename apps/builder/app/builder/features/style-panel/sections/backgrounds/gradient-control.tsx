import { toValue, UnitValue } from "@webstudio-is/css-engine";
import { Root, Range, Thumb, Track } from "@radix-ui/react-slider";
import { useState, useCallback } from "react";
import {
  reconstructLinearGradient,
  type GradientStop,
  type ParsedGradient,
} from "@webstudio-is/css-data";
import { styled, theme, Flex } from "@webstudio-is/design-system";
import { ChevronBigUpIcon } from "@webstudio-is/icons";

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
  const positions = stops.map((stop) => stop.position?.value);
  const hints = props.gradient.stops
    .map((stop) => stop.hint?.value)
    .filter(Boolean);
  const background = reconstructLinearGradient({
    stops,
    sideOrCorner: props.gradient.sideOrCorner,
    angle: defaultAngle,
  });

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