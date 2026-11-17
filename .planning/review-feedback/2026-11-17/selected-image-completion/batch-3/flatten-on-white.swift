// Flatten a transparent PNG onto a white 4:3 canvas with padding. Args: in.png out.png
import CoreGraphics
import ImageIO
import Foundation
let a = CommandLine.arguments
guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil), let img = CGImageSourceCreateImageAtIndex(s, 0, nil) else { fatalError("cannot read \(a[1])") }
let w = img.width, h = img.height
let W = Int(Double(w) * 1.12), H = max(Int(Double(h) * 1.12), W * 3 / 4)
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.draw(img, in: CGRect(x: (W - w) / 2, y: (H - h) / 2, width: w, height: h))
let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, "public.png" as CFString, 1, nil)!
CGImageDestinationAddImage(d, ctx.makeImage()!, nil); guard CGImageDestinationFinalize(d) else { fatalError("write failed") }
