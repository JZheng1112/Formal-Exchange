import { Image, StyleSheet, View } from "react-native";

type BrandLogoProps = {
  variant?: "shield" | "full";
};

export default function BrandLogo({ variant = "full" }: BrandLogoProps) {
  if (variant === "shield") {
    return (
      <Image
        source={require("../../assets/formal-exchange-shield.png")}
        accessibilityLabel="Formal Exchange"
        resizeMode="contain"
        style={styles.shield}
      />
    );
  }

  return (
    <View style={styles.fullWrap}>
      <Image
        source={require("../../assets/formal-exchange-full.png")}
        accessibilityLabel="Formal Exchange — Oxford and Cambridge"
        resizeMode="contain"
        style={styles.full}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shield: {
    width: 70,
    height: 70,
  },
  fullWrap: {
    width: "100%",
    maxWidth: 520,
    height: 150,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  full: {
    width: "100%",
    height: "100%",
  },
});
