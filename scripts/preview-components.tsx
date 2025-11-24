import { Box, render, Text } from "ink";
import { Brand } from "../src/components/Brand.js";
import { StepIndicator } from "../src/components/StepIndicator.js";
import { SuccessMessage } from "../src/components/SuccessMessage.js";

const Preview = () => (
  <Box flexDirection="column" padding={2}>
    <Text bold>1. Brand Component (Small)</Text>
    <Brand variant="small" />

    <Text bold>2. Brand Component (Large with Tagline)</Text>
    <Brand variant="large" tagline={true} />

    <Text bold>3. Step Indicator (Step 2/5)</Text>
    <StepIndicator currentStep={2} totalSteps={5} stepName="File Selection" />

    <Text bold>4. Success Message</Text>
    <SuccessMessage
      title="Commit Created Successfully"
      subtitle="Your changes are safe"
      details={["Branch: main", "Files: 3 changed"]}
    />
  </Box>
);

render(<Preview />);
