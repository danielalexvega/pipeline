import React, { useState, useEffect } from "react";
import { ABCTA, CallToAction } from "../model";
import CallToActionComponent from "./CallToAction";
import { createItemSmartLink, createElementSmartLink } from "../utils/smartlink";

type ABCTAProps = {
  abCta: ABCTA;
  isPreview?: boolean;
};

const ABCTAComponent: React.FC<ABCTAProps> = ({ abCta, isPreview = false }) => {
  const [selectedCta, setSelectedCta] = useState<"A" | "B">("A");
  const [isInitialized, setIsInitialized] = useState(false);

  // Get the CTAs
  const ctaA = abCta.elements.cta_a.linkedItems[0] as CallToAction;
  const ctaB = abCta.elements.cta_b.linkedItems[0] as CallToAction;

  // Randomly select CTA on mount (50/50 chance)
  useEffect(() => {
    if (!isPreview && !isInitialized) {
      const randomChoice = Math.random() < 0.5 ? "A" : "B";
      setSelectedCta(randomChoice);
      setIsInitialized(true);
    } else if (isPreview) {
      setIsInitialized(true);
    }
  }, [isPreview, isInitialized]);

  if (!ctaA || !ctaB) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: Missing CTA A or CTA B
      </div>
    );
  }

  const currentCta = selectedCta === "A" ? ctaA : ctaB;

  const renderCTA = (cta: CallToAction, variant: "A" | "B") => (
    <div key={`cta-${variant}`}>
      <CallToActionComponent
        title={cta.elements.headline.value}
        description={cta.elements.subheadline.value}
        buttonText={cta.elements.button_label.value}
        buttonHref={cta.elements.button_link.linkedItems[0]?.elements.url.value ?? ""}
        imageSrc={cta.elements.image.value[0]?.url}
        imageAlt={cta.elements.image.value[0]?.description ?? "alt"}
        imagePosition={cta.elements.image_position.value[0]?.codename ?? "left"}
        style={cta.elements.style?.value[0]?.codename === "mint_green" ? "mintGreen" : "white"}
        componentId={cta.system.id}
        componentName={cta.system.name}
      />
    </div>
  );

  return (
    <div
      {...createItemSmartLink(abCta.system.id)}
      {...createElementSmartLink("cta_a")}
    >
      {/* Preview Mode Controls */}
      {isPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                🧪 A/B Test Preview
              </h3>
              <p className="text-sm text-blue-700">
                Currently showing: <strong>CTA {selectedCta}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCta("A")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCta === "A"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                }`}
              >
                Show CTA A
              </button>
              <button
                onClick={() => setSelectedCta("B")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCta === "B"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                }`}
              >
                Show CTA B
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Selected CTA */}
      {isInitialized && renderCTA(currentCta, selectedCta)}

      {/* Preview Mode: Show Both CTAs Side by Side */}
      {isPreview && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Both Variants (Preview Only)
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <h5 className="font-semibold text-green-800">CTA A</h5>
              </div>
              {renderCTA(ctaA, "A")}
            </div>
            <div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <h5 className="font-semibold text-purple-800">CTA B</h5>
              </div>
              {renderCTA(ctaB, "B")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ABCTAComponent;
