const { withAndroidManifest } = require("@expo/config-plugins");

const MLKIT_BARCODE_ACTIVITY =
  "com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity";

/**
 * Assouplit l'orientation de l'activité ML Kit (fusion manifeste) pour les grands écrans / Play Console.
 */
function withMlKitBarcodeOrientation(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ || {};
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const application = manifest.application?.[0];
    if (!application) return cfg;

    application.activity = application.activity || [];
    const hasOverride = application.activity.some(
      (a) => a.$?.["android:name"] === MLKIT_BARCODE_ACTIVITY
    );
    if (!hasOverride) {
      application.activity.push({
        $: {
          "android:name": MLKIT_BARCODE_ACTIVITY,
          "android:screenOrientation": "unspecified",
          "tools:replace": "android:screenOrientation",
        },
      });
    }

    return cfg;
  });
}

module.exports = withMlKitBarcodeOrientation;
