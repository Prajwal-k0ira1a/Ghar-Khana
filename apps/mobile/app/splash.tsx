import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { Colors, Spacing } from "../src/theme/tokens";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SLIDE_DATA = [
  {
    id: "1",
    title: "Home-Cooked Meals,\nDelivered Daily",
    description:
      "Discover verified neighborhood home kitchens preparing fresh, wholesome dal bhat and traditional Nepali meals every morning.",
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    imageMain: require("../assets/splash/kitchen.jpg"),
  },
  {
    id: "2",
    title: "Your Weekly Meal\nPlan, Sorted",
    description:
      "Subscribe once, eat every day. Swap dishes or skip any meal before 10:30 AM with zero penalty.",
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    imageMain: require("../assets/splash/planner.jpg"),
  },
  {
    id: "3",
    title: "Hot Tiffin at\nYour Doorstep",
    description:
      "Neighborhood batch delivery brings your meal warm and fresh between 12:30 and 1:15 PM, every single day.",
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    imageMain: require("../assets/splash/delivery.jpg"),
  },
];

export default function SplashScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDE_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.replace("/(auth)/welcome");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/welcome");
  };

  const renderSlide = ({ item }: { item: typeof SLIDE_DATA[0] }) => (
    <View style={styles.slide}>
      {/* Image Collage Area */}
      <View style={styles.imageArea}>
        {/* Background subtle shape */}
        <View style={styles.imageBgShape} />

        {/* Main tilted image */}
        <View style={styles.mainImageWrapper}>
          <Image
            source={item.imageMain}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </View>

        {/* Smaller secondary accent image (rotated opposite) */}
        <View style={styles.accentImageWrapper}>
          <Image
            source={item.imageMain}
            style={styles.accentImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Text Content */}
      <View style={styles.textArea}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDE_DATA}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {/* Dot Indicators */}
        <View style={styles.dotsContainer}>
          {SLIDE_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Skip + Next Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={styles.nextButton}
            accessibilityRole="button"
            accessibilityLabel={
              currentIndex === SLIDE_DATA.length - 1
                ? "Get started"
                : "Next slide"
            }
            activeOpacity={0.85}
          >
            <ArrowRight size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const IMAGE_AREA_HEIGHT = SCREEN_HEIGHT * 0.52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F0",
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },

  // ── Image collage area ──────────────────────────────────
  imageArea: {
    height: IMAGE_AREA_HEIGHT,
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageBgShape: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.85,
    height: IMAGE_AREA_HEIGHT * 0.8,
    borderRadius: 32,
    backgroundColor: "#E4EBE4",
    transform: [{ rotate: "-3deg" }],
    top: IMAGE_AREA_HEIGHT * 0.1,
  },
  mainImageWrapper: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.68,
    height: IMAGE_AREA_HEIGHT * 0.78,
    borderRadius: 24,
    overflow: "hidden",
    transform: [{ rotate: "4deg" }],
    top: IMAGE_AREA_HEIGHT * 0.06,
    left: SCREEN_WIDTH * 0.08,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  accentImageWrapper: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.38,
    height: IMAGE_AREA_HEIGHT * 0.45,
    borderRadius: 18,
    overflow: "hidden",
    transform: [{ rotate: "-6deg" }],
    bottom: IMAGE_AREA_HEIGHT * 0.04,
    right: SCREEN_WIDTH * 0.06,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  accentImage: {
    width: "100%",
    height: "100%",
  },

  // ── Text content ────────────────────────────────────────
  textArea: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: Spacing.sm,
    maxWidth: 320,
  },

  // ── Bottom bar ──────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl + 12,
    paddingTop: Spacing.md,
    backgroundColor: "#F0F4F0",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C8D1C8",
  },
  dotActive: {
    width: 28,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipButton: {
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
