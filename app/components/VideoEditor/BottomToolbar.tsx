import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface BottomToolbarProps {
  onToolSelect: (tool: string) => void;
  activeTool?: string;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onToolSelect,
  activeTool = 'edit',
}) => {
  const [selectedTool, setSelectedTool] = useState(activeTool);

  const tools = [
    {
      id: 'edit',
      name: 'Edit',
      icon: 'content-cut',
    },
    {
      id: 'audio',
      name: 'Audio',
      icon: 'music-note',
    },
    {
      id: 'text',
      name: 'Text',
      icon: 'text-fields',
    },
    {
      id: 'stickers',
      name: 'Stickers',
      icon: 'emoji-emotions',
    },
    {
      id: 'transitions',
      name: 'Transitions',
      icon: 'compare-arrows',
    },

  ];

  const handleToolPress = (toolId: string) => {
    setSelectedTool(toolId);
    onToolSelect(toolId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsContainer}
      >
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              selectedTool === tool.id && styles.selectedToolButton,
            ]}
            onPress={() => handleToolPress(tool.id)}
          >
            <View
              style={[
                styles.iconContainer,
                selectedTool === tool.id && styles.selectedIconContainer,
              ]}
            >
              <MaterialIcons
                name={tool.icon as any}
                size={moderateScale(24)}
                color={selectedTool === tool.id ? '#259B9A' : '#fff'}
              />
            </View>
            <Text
              style={[
                styles.toolText,
                selectedTool === tool.id && styles.selectedToolText,
              ]}
            >
              {tool.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    paddingVertical: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolsContainer: {
    paddingHorizontal: moderateScale(15),
    gap: moderateScale(20),
  },
  toolButton: {
    alignItems: 'center',
    minWidth: moderateScale(60),
  },
  selectedToolButton: {
    // Additional styling for selected state if needed
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(4),
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderWidth: 1,
    borderColor: '#259B9A',
  },
  toolText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  selectedToolText: {
    color: '#259B9A',
    fontWeight: '600',
  },
});

export default BottomToolbar;