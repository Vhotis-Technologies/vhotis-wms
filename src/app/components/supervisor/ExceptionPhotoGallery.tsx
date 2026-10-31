import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ExceptionPhotoGalleryProps {
  photoUrls: string[];
}

export default function ExceptionPhotoGallery({
  photoUrls,
}: ExceptionPhotoGalleryProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");

  if (photoUrls.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: cardColor, borderColor },
        ]}
      >
        <StyledText variant="body" color={iconMuted}>
          No photos attached to this exception.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StyledText variant="label" color={iconMuted}>
        Evidence photos ({photoUrls.length})
      </StyledText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {photoUrls.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            style={[styles.photo, { borderColor }]}
            contentFit="cover"
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    gap: 10,
    paddingRight: 8,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#1a1a1a20",
  },
  empty: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
});
