import { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Image, FileText, ChevronRight } from "lucide-react-native";

export interface AttachmentSheetRef {
  open: () => void;
  close: () => void;
}

interface AttachmentOption {
  key: string;
  icon: typeof Camera;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const options: AttachmentOption[] = [
  {
    key: "camera",
    icon: Camera,
    title: "Camera",
    description: "Take a photo instantly",
    color: "#8B5CF6",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    key: "library",
    icon: Image,
    title: "Photo Library",
    description: "Choose from your gallery",
    color: "#3B82F6",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    key: "document",
    icon: FileText,
    title: "Document",
    description: "PDF, ZIP, DOCX and more",
    color: "#10B981",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
];

interface AttachmentSheetProps {
  onSelect: (option: string) => void;
}

export const AttachmentSheet = forwardRef<AttachmentSheetRef, AttachmentSheetProps>(
  function AttachmentSheet({ onSelect }, ref) {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const snapPoints = useMemo(() => ["50%"], []);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.snapToIndex(0),
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleSelect = useCallback((key: string) => {
      bottomSheetRef.current?.close();
      onSelect(key);
    }, [onSelect]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF" }}
      >
        <BottomSheetView className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row items-center justify-between mb-6 pt-2">
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Attach
            </Text>
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.close()}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
            >
              <Text className="text-neutral-400 dark:text-neutral-500 text-lg leading-none">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.key}
                  className="flex-row items-center px-4 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 active:bg-neutral-100 dark:active:bg-neutral-800"
                  onPress={() => handleSelect(opt.key)}
                  activeOpacity={0.7}
                >
                  <View className={`w-12 h-12 rounded-xl ${opt.bgColor} items-center justify-center`}>
                    <Icon size={22} color={opt.color} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {opt.title}
                    </Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {opt.description}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={isDark ? "#525252" : "#D4D4D4"} />
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);
