<?php
/**
 * send_mail.php — Formulaire de contact Loulouchana
 * Utilise PHPMailer via Composer
 * Compatible IONOS hébergement mutualisé
 *
 * ⚠️ AVANT DE METTRE EN LIGNE :
 *   1. Remplis les constantes SMTP_* ci-dessous
 *   2. Change ALLOWED_ORIGIN avec ton vrai domaine
 */

declare(strict_types=1);

// ─── CONFIGURATION — À MODIFIER ────────────────────────────────────────────

define('SMTP_HOST',     'smtp.ionos.fr');       // Serveur SMTP IONOS (ou smtp.ionos.com)
define('SMTP_PORT',     587);                    // 587 = STARTTLS  |  465 = SSL
define('SMTP_SECURE',   'tls');                  // 'tls' pour 587  |  'ssl' pour 465
define('SMTP_USER',     'contact@tondomaine.fr'); // Ton adresse email IONOS
define('SMTP_PASS',     'TON_MOT_DE_PASSE');     // Mot de passe email IONOS

define('MAIL_FROM',     'contact@tondomaine.fr'); // Expéditeur (= SMTP_USER sur IONOS)
define('MAIL_FROM_NAME','Loulouchana — Contact'); // Nom affiché
define('MAIL_TO',       'loulouchana@tondomaine.fr'); // Destinataire (toi)
define('MAIL_SUBJECT',  '[Contact] Nouveau message via loulouchana.fr');

define('ALLOWED_ORIGIN', 'https://www.tondomaine.fr'); // Ton domaine exact (sans slash final)

// ─── SÉCURITÉ — NE PAS MODIFIER ────────────────────────────────────────────

// Réponse JSON uniquement
header('Content-Type: application/json; charset=UTF-8');

// CORS — n'autorise que ton propre domaine
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === ALLOWED_ORIGIN) {
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: POST');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Bloquer tout ce qui n'est pas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['success' => false, 'error' => 'Méthode non autorisée.']));
}

// Bloquer les requêtes non-JSON ou sans contenu
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') === false) {
    http_response_code(415);
    exit(json_encode(['success' => false, 'error' => 'Content-Type invalide.']));
}

// ─── LECTURE & VALIDATION DES DONNÉES ──────────────────────────────────────

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'error' => 'Données invalides.']));
}

// Nettoyage des champs
$name    = trim(strip_tags($data['name']    ?? ''));
$email   = trim(strip_tags($data['email']   ?? ''));
$subject = trim(strip_tags($data['subject'] ?? ''));
$message = trim(strip_tags($data['message'] ?? ''));

$errors = [];

// Validation serveur (double sécurité avec le JS front)
if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    $errors[] = 'Prénom invalide.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 254) {
    $errors[] = 'Email invalide.';
}
$subjectsAllowed = ['collab', 'gifting', 'evenement', 'presse', 'autre'];
if (!in_array($subject, $subjectsAllowed, true)) {
    $errors[] = 'Sujet invalide.';
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    $errors[] = 'Message trop court ou trop long.';
}

// Protection anti-spam basique (honeypot field ignoré si présent)
if (!empty($data['website'])) {
    // Bot détecté — on fait semblant de réussir
    http_response_code(200);
    exit(json_encode(['success' => true]));
}

// Rate limiting simple via session (1 envoi / 60s par session)
session_start();
$now = time();
if (isset($_SESSION['last_mail_sent']) && ($now - $_SESSION['last_mail_sent']) < 60) {
    http_response_code(429);
    exit(json_encode(['success' => false, 'error' => 'Merci de patienter avant de renvoyer un message.']));
}

if (!empty($errors)) {
    http_response_code(422);
    exit(json_encode(['success' => false, 'errors' => $errors]));
}

// ─── ENVOI VIA PHPMAILER ────────────────────────────────────────────────────

// Chargement de l'autoloader Composer
$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    http_response_code(500);
    error_log('[Loulouchana] PHPMailer introuvable. Lance: composer install');
    exit(json_encode(['success' => false, 'error' => 'Erreur serveur (mailer). Contacte-moi directement sur Instagram.']));
}
require $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Labels lisibles pour le sujet
$subjectLabels = [
    'collab'    => 'Collaboration / Partenariat',
    'gifting'   => 'Gifting / Test produit',
    'evenement' => 'Événement / Soirée',
    'presse'    => 'Presse / Interview',
    'autre'     => 'Autre demande',
];
$subjectLabel = $subjectLabels[$subject] ?? $subject;

// Corps du mail en HTML
$htmlBody = "
<!DOCTYPE html>
<html lang='fr'>
<head><meta charset='UTF-8'></head>
<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa;'>
  <div style='background: #0d0d0d; padding: 30px 40px; text-align: center;'>
    <p style='font-family: Georgia, serif; font-size: 28px; color: #FFB6C1; margin: 0;'>Loulouchana</p>
    <p style='color: rgba(255,255,255,0.5); font-size: 12px; letter-spacing: 2px; margin: 6px 0 0;'>NOUVEAU MESSAGE DE CONTACT</p>
  </div>
  <div style='background: #fff; padding: 35px 40px; border: 1px solid #eee;'>
    <table style='width: 100%; border-collapse: collapse;'>
      <tr>
        <td style='padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #999; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; width: 30%;'>Prénom / Marque</td>
        <td style='padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #0d0d0d;'>" . htmlspecialchars($name) . "</td>
      </tr>
      <tr>
        <td style='padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #999; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;'>Email</td>
        <td style='padding: 12px 0; border-bottom: 1px solid #f0f0f0;'><a href='mailto:" . htmlspecialchars($email) . "' style='color: #f07b91;'>" . htmlspecialchars($email) . "</a></td>
      </tr>
      <tr>
        <td style='padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #999; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;'>Sujet</td>
        <td style='padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #0d0d0d;'>" . htmlspecialchars($subjectLabel) . "</td>
      </tr>
    </table>
    <div style='margin-top: 25px;'>
      <p style='color: #999; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;'>Message</p>
      <div style='background: #f9f9f9; border-left: 3px solid #FFB6C1; padding: 20px; border-radius: 0 4px 4px 0; font-size: 15px; line-height: 1.7; color: #333; white-space: pre-wrap;'>" . htmlspecialchars($message) . "</div>
    </div>
    <div style='margin-top: 30px; text-align: center;'>
      <a href='mailto:" . htmlspecialchars($email) . "' style='display: inline-block; background: #f07b91; color: #fff; padding: 12px 28px; border-radius: 3px; text-decoration: none; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;'>→ Répondre à " . htmlspecialchars($name) . "</a>
    </div>
  </div>
  <div style='padding: 20px 40px; text-align: center; color: #bbb; font-size: 11px;'>
    <p>Message reçu le " . date('d/m/Y à H:i') . " · loulouchana.fr</p>
  </div>
</body>
</html>
";

// Version texte plain
$textBody = "Nouveau message de contact — Loulouchana\n\n"
    . "Prénom / Marque : {$name}\n"
    . "Email           : {$email}\n"
    . "Sujet           : {$subjectLabel}\n"
    . "Date            : " . date('d/m/Y à H:i') . "\n\n"
    . "Message :\n{$message}\n";

try {
    $mail = new PHPMailer(true); // true = exceptions activées

    // Serveur SMTP
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = SMTP_SECURE === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    // Expéditeur & destinataire
    $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
    $mail->addAddress(MAIL_TO);
    // Reply-To : permet de répondre directement à la personne qui écrit
    $mail->addReplyTo($email, $name);

    // Contenu
    $mail->isHTML(true);
    $mail->Subject = MAIL_SUBJECT . " — {$subjectLabel}";
    $mail->Body    = $htmlBody;
    $mail->AltBody = $textBody;

    $mail->send();

    // Enregistrer le timestamp pour le rate limiting
    $_SESSION['last_mail_sent'] = $now;

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Email envoyé avec succès.']);

} catch (Exception $e) {
    http_response_code(500);
    // Ne jamais exposer les détails SMTP en production
    error_log('[Loulouchana] Erreur PHPMailer : ' . $mail->ErrorInfo);
    echo json_encode([
        'success' => false,
        'error'   => 'Erreur lors de l\'envoi. Contacte-moi directement sur Instagram 💌'
    ]);
}
