
from urllib.parse import urlparse
import ipaddress
import re

import requests

def check_urlhaus(url, auth_key):
    if not auth_key:
        return {"status": "not_configured"}

    headers = {
        "Auth-Key": auth_key
    }

    data = {
        "url": url
    }

    try:
        response = requests.post(
            "https://urlhaus-api.abuse.ch/v1/url/",
            data=data,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()
        result = response.json()

        if result.get("query_status") == "ok":
            return {
                "status": "listed",
                "url_status": result.get("url_status"),
                "reference": result.get("urlhaus_reference")
            }

        if result.get("query_status") == "no_results":
            return {"status": "not_listed"}

        return {"status": "unavailable"}

    except requests.RequestException:
        return {"status": "unavailable"}
    except ValueError:
        return {"status": "unavailable"}

def scan_url(url):
    findings = []

    # Add HTTPS if the user did not enter a protocol
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        parsed = urlparse(url)
        hostname = parsed.hostname

        if not hostname:
            return {
                "status": "Invalid Input",
                "risk_score": 0,
                "findings": ["Invalid website URL"]
            }

        # Check HTTPS
        if parsed.scheme != "https":
            findings.append("Website does not use HTTPS")

        # Check suspicious URL characters
        if "@" in url:
            findings.append("URL contains an @ symbol")

        # Check punycode domains
        if "xn--" in hostname:
            findings.append("Domain uses punycode encoding")

        # Check unusually many subdomains
        if len(hostname.split(".")) > 4:
            findings.append("Unusually many subdomains")

        # Check IP address instead of domain
        try:
            ipaddress.ip_address(hostname)
            findings.append("Website uses an IP address")
        except ValueError:
            pass

        # Check excessive hyphens
        if hostname.count("-") >= 3:
            findings.append("Domain contains multiple hyphens")


        suspicious_words = [
                "login",
                "verify",
                "secure",
                "account",
                "update",
                "banking",
                "password"
            ]

        if any(word in hostname.lower() for word in suspicious_words):
                findings.append("Domain contains suspicious keywords")
        typo_patterns = [
            "g00gle",
            "goog1e",
            "paypa1",
            "payp4l",
            "amaz0n",
            "arnazon"
        ]

        if any(pattern in hostname.lower() for pattern in typo_patterns):
            findings.append("Possible typosquatting detected")

        risk_score = min(len(findings) * 20, 100)

        
        if risk_score >= 70:
            status = "Critical Indicators"
        elif risk_score >= 40:
            status = "High Risk Indicators"
        elif risk_score >= 20:
            status = "Suspicious Indicators"
        else:
            status = "Low Risk Indicators"

        return {
            "status": status,
            "risk_score": risk_score,
            "findings": findings,
            "scanned_url": url,
            "disclaimer": "Heuristic assessment only. This does not prove a website is safe or malicious."
        }

    except Exception:
        return {
            "status": "Invalid Input",
            "risk_score": 0,
            "findings": ["Unable to analyse this URL"]
        }
